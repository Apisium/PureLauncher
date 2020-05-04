import { Store, injectStore } from 'reqwq'
import { LaunchOption, Version, launch, LaunchPrecheck } from '@xmcl/core/index'
import { Installer } from '@xmcl/installer/index'
import { getVersionTypeText, addTask, installJava, findJavaPath,
  getSuitableMemory, isX64, openServerHome } from '../utils/index'
import { GAME_ROOT, LIBRARIES_PATH, VERSIONS_PATH, IS_WINDOWS } from '../constants'
import { version as launcherBrand } from '../../package.json'
import { remote, ipcRenderer, BrowserView } from 'electron'
import { getDownloaders } from '../plugin/DownloadProviders'
import { totalmem, freemem, release } from 'os'
import { LaunchExtraOptions } from '../protocol/types'
import { ChildProcess } from 'child_process'
import { Profile } from '../plugin/Authenticator'
import { join } from 'path'
import fs from 'fs-extra'
import user from '../utils/analytics'
import prettyBytes from 'pretty-bytes'
import ProfilesStore from './ProfilesStore'
import updateResources from '../protocol/check-update'

const CSS = `body {
  white-space: pre;
  letter-spacing: 1px;
  font-size: 0.9rem;
  background-color: #282a36;
  color: #f8f8f2;
  font-family: Roboto, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif, 'Apple Color Emoji',
    'Segoe UI Emoji', 'Segoe UI Symbol';
}
.r { color: #ff5555 }
.y { color: #f1fa8c }
.g { color: #50fa7b }
.b { color: #8be9fd }
.n { margin: 0 }
`

let logWindow: BrowserView

const currentWindow = remote.getCurrentWindow()

export enum STATUS {
  READY, PREPARING, LAUNCHING, LAUNCHED, DOWNLOADING
}

interface Args { versionId: string, versionDir: string, javaPath: string, profile: Profile, maxMemory: number }
export default class GameStore extends Store {
  public status = STATUS.READY
  public process: ChildProcess

  @injectStore(ProfilesStore)
  private profilesStore: ProfilesStore

  public async launch (version?: string, options: LaunchExtraOptions = { }) {
    if (this.status !== STATUS.READY) return
    try {
      const showGameLog = this.profilesStore.settings.showGameLog
      const ret = await this.genLaunchOptions(version, options)
      let launched = false
      const launch2 = async () => {
        try {
          this.process = await launch(ret.option)
          if (logWindow) {
            if (showGameLog) await logWindow.webContents.executeJavaScript('document.body.innerText=""')
            else {
              logWindow.destroy()
              logWindow = null
            }
          } else if (showGameLog) {
            logWindow = new remote.BrowserWindow({ title: 'PureLauncher - Game Log' }) as any
            logWindow.webContents.loadURL('about:blank')
            logWindow.webContents.once('destroyed', () => (logWindow = null))
          }
          if (showGameLog) {
            await logWindow.webContents.insertCSS(CSS)
          }
          await this.waitForLaunch(ret)
          await pluginMaster.emit('postLaunch', this.process, ret.versionId, ret.option)
        } catch (e) {
          notice({ content: $('Fail to launch') + ': ' + ((e ? e.message : e) || $('Unknown')), error: true })
          if (typeof e === 'object' && e.error) {
            switch (e.error) {
              case 'MissingLibs':
                if (launched) {
                  const m = $('Missing libraries')
                  openConfirmDialog({ text: `${$('Fail to launch')}, ${m}: ${e.libs.map(it => it.name).join(', ')}` })
                  throw new Error(m)
                }
                launched = true
                this.status = STATUS.DOWNLOADING
                await this.ensureLocalVersion(ret.versionId)
                this.status = STATUS.LAUNCHING
                await launch2()
                return
              case 'CorruptedLibs':
                if (launched) {
                  const m = $('Bad libraries')
                  openConfirmDialog({ text: `${$('Fail to launch')}, ${m}:\n${e.libs.map(it => it.name).join('\n')}` })
                  throw new Error(m)
                }
                launched = true
                notice({ content: $('Found wrong libraries, will automatically download again!') })
                this.status = STATUS.DOWNLOADING
                await Promise.all(e.libs.map(it => fs.unlink(join(LIBRARIES_PATH, it.path)).catch(console.error)))
                await this.ensureLocalVersion(ret.versionId)
                this.status = STATUS.LAUNCHING
                await launch2()
                return
              case 'CorruptedVersionJar':
                throw new Error($('Bad version jar!'))
              case 'CorruptedVersionJson':
                launched = true
                /* fallthrough */
              case 'MissingVersionJson':
                this.status = STATUS.DOWNLOADING
                if (e.version) {
                  await this.profilesStore.ensureVersionManifest()
                  await this.ensureMinecraftVersion(this.profilesStore.versionManifest.versions
                    .find(v => v.id === e.version))
                }
                this.status = STATUS.LAUNCHING
                await launch2()
                return
            }
          }
          throw e
        }
      }
      await launch2()
    } catch (e) {
      notice({ content: $('Fail to launch') + ': ' + ((e ? e.message : e) || $('Unknown')), error: true })
      this.status = STATUS.READY
      ipcRenderer.send('close-launching-dialog')
      if (currentWindow.isMinimized()) {
        currentWindow.restore()
        currentWindow.setSize(816, 586)
      }
      throw e
    }
  }

  private waitForLaunch (args: Args) {
    return this.process ? new Promise((resolve, reject) => {
      this.process.once('close', code => {
        if (code !== 0) notice({ content: $('Abnormal exit detected, exit code:') + ' ' + code, error: true })
        ipcRenderer.send('close-launching-dialog')
        if (this.profilesStore.extraJson.animation) startAnimation()
        if (currentWindow.isMinimized()) {
          currentWindow.restore()
          currentWindow.setSize(816, 586)
          currentWindow.setAlwaysOnTop(true)
          currentWindow.setAlwaysOnTop(false)
        }
        this.status = STATUS.READY
        this.process = null
      }).once('error', e => {
        this.status = STATUS.READY
        this.process = null
        reject(e)
      })
      this.process.stdout
        .once('data', () => resolve())
        .on('data', data => data.includes('OpenAL initialized.') && ipcRenderer.send('close-launching-dialog'))
      if (this.profilesStore.settings.showGameLog) {
        const write = (text: string, color) => logWindow &&
          logWindow.webContents.executeJavaScript(`;(() => {
            const elm = document.createElement('p')
            elm.innerText = ${JSON.stringify(text.toString())}
            elm.className = '${color}'
            document.body.appendChild(elm)
          })()`)
        write(`Laucnher: PureLauncher v${launcherBrand}
Elec[tron version: ${process.versions.electron}
Nodejs version: ${process.versions.node}
Chrome version: ${process.versions.chrome}
Game id: ${args.versionId}
Game root: ${args.versionDir}
Java path: ${args.javaPath}, X64: ${isX64 || false}
Authenticator: ${args.profile.type}
User - Name: ${args.profile.username}, UUID: ${args.profile.uuid}
Memory - Game: ${args.maxMemory} Mb, System: ${prettyBytes(totalmem())}, Free: ${prettyBytes(freemem())}
System:] ${process.platform} ${release()}, Arch: ${process.arch}`, 'b')
        write('Process launched - Pid: ' + this.process.pid, 'g')
        this.process.stderr.on('data', data => write(data, 'r'))
        this.process.stdout.on('data', data => write(data, 'n'))
        this.process.once('close', (code, signal) => {
          write(`Process exited - ExitCode: ${code}, Signal: ${signal}`, 'y')
          if (code) {
            write($(
              'The game launched successfully, but the game has exited abnormally. Game crash is not a problem of PureLauncher, but may be caused by incompatible mods. So please DO NOT report this log to PureLauncher!'
            ), 'b')
          }
        })
      }
    }) : Promise.resolve()
  }

  private async genLaunchOptions (version?: string, options: LaunchExtraOptions = { }) {
    this.status = STATUS.PREPARING
    const { extraJson, getCurrentProfile, selectedVersion, profiles,
      ensureVersionManifest, checkModsDirectoryOfVersion } = this.profilesStore

    if (version in profiles) version = profiles[version].lastVersionId
    if (!version) {
      version = selectedVersion.lastVersionId
      switch (selectedVersion.type) {
        case 'latest-release':
        case 'latest-snapshot':
          version = selectedVersion.type
      }
    }
    const v = { version }
    await pluginMaster.emitSync('launchResolveVersion', v)
    version = v.version

    user.event('game', 'launch').catch(console.error)
    const { javaArgs, javaPath: jp } = extraJson

    let profile = getCurrentProfile()
    if (!profile) throw new Error('No selected profile!')
    const authenticator = pluginMaster.logins[profile.type]
    try {
      if (!await authenticator.validate(profile.key, true)) {
        throw new Error($('Current account is invalid, please re-login!'))
      }
    } catch (e) {
      if (!e || !e.connectFailed || !await openConfirmDialog({
        text: $('Network connection failed. Do you want to play offline?'),
        cancelButton: true
      })) throw e
    }
    profile = getCurrentProfile()

    let versionId: string

    this.status = STATUS.DOWNLOADING
    switch (version) {
      case 'latest-release': {
        await ensureVersionManifest()
        const { latest, versions } = this.profilesStore.versionManifest
        versionId = latest.release
        await this.ensureMinecraftVersion(versions.find(v => v.id === versionId))
        break
      }
      case 'latest-snapshot': {
        await ensureVersionManifest()
        const { latest, versions } = this.profilesStore.versionManifest
        versionId = latest.snapshot
        await this.ensureMinecraftVersion(versions.find(v => v.id === versionId))
        break
      }
      default:
        versionId = version
        await this.ensureLocalVersion(versionId)
        break
    }

    v.version = versionId
    await pluginMaster.emitSync('launchPostResolvedVersion', v)
    versionId = v.version

    await pluginMaster.emit('launchPreUpdate', v.version, profile)
    const json = await updateResources(versionId)
    await pluginMaster.emit('launchPostUpdate', v.version, profile, json)

    openServerHome(json?.serverHome)

    await checkModsDirectoryOfVersion(versionId, json)
    await pluginMaster.emit('launchEnsureFiles', versionId)

    const javaPath = await this.resolveJavaPath(jp)
    const versionDir = join(VERSIONS_PATH, versionId)
    const isX64 = !!JSON.parse(localStorage.getItem('javaArches') || '{}')[javaPath]
    const maxMemory = getSuitableMemory(isX64)
    const option: LaunchOption & { prechecks?: LaunchPrecheck[] } = {
      javaPath,
      maxMemory,
      launcherBrand,
      properties: {},
      minMemory: 512,
      userType: 'mojang',
      version: versionId,
      resourcePath: GAME_ROOT,
      launcherName: 'pure-launcher',
      versionType: getVersionTypeText(),
      extraJVMArgs: javaArgs.split(' '),
      accessToken: profile.accessToken || '',
      prechecks: extraJson.noChecker ? [] : undefined,
      gameProfile: { id: profile.uuid, name: profile.username },
      gamePath: json?.isolation || (await fs.readJson(join(versionDir, versionId + '.json'),
        { throws: false }))?.isolation ? versionDir : GAME_ROOT,
      extraExecOption: { detached: true },
      isDemo: options.isDemo,
      resolution: options.resolution,
      server: options.server || json?.server
    }
    await pluginMaster.emitSync('preLaunch', versionId, option, profile)
    this.status = STATUS.LAUNCHING
    remote.getCurrentWindow().minimize()
    if (extraJson.animation) {
      setTimeout(() => ipcRenderer.send('open-launching-dialog'), 3000)
      stopAnimation()
    }
    return { option, versionId, versionDir, javaPath, maxMemory, profile }
  }

  private async ensureMinecraftVersion (version: Pick<Installer.Version, 'url' | 'id'>) {
    if (!version) throw new Error('No version provided!')
    const task = Installer.installTask('client', version, GAME_ROOT, getDownloaders())
    await addTask(task, $('Ensure version JAR'), version.id).wait()
  }
  private async ensureLocalVersion (versionId: string) {
    if (!versionId) throw new Error('No version provided!')
    const resolved = await Version.parse(GAME_ROOT, versionId)
    const task = Installer.installDependenciesTask(resolved, getDownloaders())
    await addTask(task, $('Ensure version files'), versionId).wait()
  }

  public async resolveJavaPath (javaPath: string) {
    if (!javaPath && !(javaPath = localStorage.getItem('javaPath')) && (javaPath = await findJavaPath())) {
      localStorage.setItem('javaPath', javaPath)
      const arches = JSON.parse(localStorage.getItem('javaArches') || '{}')
      arches[javaPath] = isX64()
      localStorage.setItem('javaArches', JSON.stringify(arches))
    }
    if (!javaPath || !await fs.pathExists(javaPath)) {
      localStorage.removeItem('javaPath')
      if (IS_WINDOWS && await openConfirmDialog({
        text: $('Unable to find the Java, do you want to install Java automatically?'),
        cancelButton: true
      })) {
        javaPath = await installJava().catch(e => {
          console.error(e)
          throw new Error($('Failed to install Java!'))
        })
      } else throw new Error($('No Java available!'))
    }
    return javaPath
  }
}
