import { Store, injectStore, NOT_PROXY } from 'reqwq'
import { Launcher } from '@xmcl/launch'
import { Installer } from '@xmcl/installer'
import { Version } from '@xmcl/version'
import { download } from '../utils/index'
import { GAME_ROOT } from '../constants'
import { version as launcherBrand } from '../../package.json'
import { remote, ipcRenderer } from 'electron'
import ProfilesStore from './ProfilesStore'
import Task from '@xmcl/task'
import user from '../utils/analytics'
import updateResources from '../protocol/check-update'

export enum STATUS {
  READY, PREPARING, LAUNCHING, LAUNCHED, DOWNLOADING
}

const currentWindow = remote.getCurrentWindow()
export default class GameStore extends Store {
  public status = STATUS.READY

  @injectStore(ProfilesStore)
  private profilesStore: ProfilesStore
  private currentVersionId: string
  private worker = Object.assign(new Worker('../workers/launch.ts'), { [NOT_PROXY]: true })

  constructor () {
    super()
    this.worker.addEventListener('message', m => {
      const { state, error } = m.data
      pluginMaster.emit('launchMessage', this.currentVersionId, state, error)
      switch (state) {
        case 'error':
          console.error(error)
          notice({ content: $('Fail to launch!'), error: true })
          this.status = STATUS.READY
          ipcRenderer.send('close-launching-dialog')
          if (currentWindow.isMinimized()) {
            currentWindow.restore()
            currentWindow.setSize(816, 586)
          }
          break
        case 'launched':
          console.log('launched!')
          this.status = STATUS.LAUNCHED
          break
        case 'exit':
          if (m.data.code !== 0) {
            // this.error = ({ code: m.data.code, signal: m.data.signal })
          }
          this.status = STATUS.READY
          ipcRenderer.send('close-launching-dialog')
          if (currentWindow.isMinimized()) {
            currentWindow.restore()
            currentWindow.setSize(816, 586)
          }
          console.log('exit')
          break
      }
    })
  }
  public async launch (version?: string) {
    if (this.status !== STATUS.READY) return
    try {
      this.status = STATUS.PREPARING
      const { extraJson, getCurrentProfile, selectedVersion, versionManifest, profiles,
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
      const { javaArgs, javaPath } = extraJson

      let profile = getCurrentProfile()
      if (!profile) throw new Error('No selected profile!')
      const authenticator = pluginMaster.logins[profile.type]
      if (!await authenticator.validate(profile.key)) await authenticator.refresh(profile.key)
      profile = getCurrentProfile()

      let versionId: string

      this.status = STATUS.DOWNLOADING
      switch (version) {
        case 'latest-release':
          await ensureVersionManifest()
          versionId = versionManifest.latest.release
          await this.ensureMinecraftVersion(GAME_ROOT, versionManifest.versions.find(v => v.id === versionId))
          break
        case 'latest-snapshot':
          await ensureVersionManifest()
          versionId = versionManifest.latest.snapshot
          await this.ensureMinecraftVersion(GAME_ROOT, versionManifest.versions.find(v => v.id === versionId))
          break
        default:
          versionId = version
          await this.ensureLocalVersion(GAME_ROOT, versionId)
          break
      }

      v.version = versionId
      await pluginMaster.emitSync('launchPostResolvedVersion', v)
      versionId = v.version

      await pluginMaster.emit('launchPreUpdate', v.version)
      const ret = await updateResources(versionId)
      await pluginMaster.emit('launchPostUpdate', v.version)

      await checkModsDirectoryOfVersion(versionId, ret)
      await pluginMaster.emit('launchEnsureFiles', versionId)

      const option: Launcher.Option = {
        launcherBrand,
        properties: {},
        version: versionId,
        gamePath: GAME_ROOT,
        userType: 'mojang' as any,
        launcherName: 'pure-launcher',
        extraJVMArgs: javaArgs.split(' '),
        accessToken: profile.accessToken || '',
        gameProfile: { id: profile.uuid, name: profile.username },
        javaPath: javaPath || 'javaw',
        extraExecOption: {
          detached: true
        }
      }
      await pluginMaster.emitSync('preLaunch', versionId, option)
      this.status = STATUS.LAUNCHING
      remote.getCurrentWindow().minimize()
      setTimeout(() => ipcRenderer.send('open-launching-dialog'), 3000)
      this.worker.postMessage(option)

      await new Promise((res, rej) => {
        const onceLaunch = (m: MessageEvent) => {
          const { state, error } = m.data
          switch (state) {
            case 'error':
              this.worker.removeEventListener('message', onceLaunch)
              rej(error)
              break
            case 'launched':
              this.worker.removeEventListener('message', onceLaunch)
              res()
              break
          }
        }
        this.worker.addEventListener('message', onceLaunch)
      })
      this.currentVersionId = versionId
      await pluginMaster.emit('postLaunch', versionId, option)
    } catch (e) {
      this.status = STATUS.READY
      ipcRenderer.send('close-launching-dialog')
      if (currentWindow.isMinimized()) {
        currentWindow.restore()
        currentWindow.setSize(816, 586)
      }
      throw e
    }
  }
  private async ensureMinecraftVersion (minecraft: string, version: Installer.VersionMeta) {
    const task = Installer.installTask('client', version, minecraft, {
      downloader ({ url, destination }) {
        return download({ url, file: destination }).then(() => undefined)
      }
    })
    await Task.execute(task)
  }
  private async ensureLocalVersion (minecraft: string, versionId: string) {
    const resolved = await Version.parse(minecraft, versionId)
    const task = Installer.installDependenciesTask(resolved, {
      downloader ({ url, destination }) {
        return download({ url, file: destination }).then(() => undefined)
      }
    })
    await Task.execute(task)
  }
}
