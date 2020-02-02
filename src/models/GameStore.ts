import { Store, injectStore, NOT_PROXY } from 'reqwq'
import { Launcher } from '@xmcl/launch'
import { Installer } from '@xmcl/installer'
import { Version } from '@xmcl/version'
import { download } from '../utils/index'
import { join } from 'path'
import fs from 'fs-extra'
import ProfilesStore from './ProfilesStore'
import Task from '@xmcl/task'
import user from '../utils/analytics'
import updateResources from '../protocol/check-update'
import { GAME_ROOT, MODS_PATH, VERSIONS_PATH } from '../constants'

export enum STATUS {
  READY, LAUNCHING, LAUNCHED, DOWNLOADING
}

export default class GameStore extends Store {
  public status = STATUS.READY

  @injectStore(ProfilesStore)
  private profilesStore: ProfilesStore
  private currentVersionId: string
  private worker = Object.assign(new Worker('../workers/launch.ts'), { [NOT_PROXY]: true })

  constructor () {
    super()
    this.worker.addEventListener('message', (m) => {
      const { state, error } = m.data
      pluginMaster.emit('launchMessage', this.currentVersionId, state, error)
      switch (state) {
        case 'error':
          // this.error = error
          console.error(error)
          notice({ content: $('Fail to launch!'), error: true })
          this.status = STATUS.READY
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
          console.log('exit')
          break
      }
    })
  }
  public async launch (version?: string) {
    const v = { version }
    await pluginMaster.emitSync('launchResolveVersion', v)
    version = v.version

    user.event('game', 'launch').catch(console.error)
    const { extraJson, getCurrentProfile, selectedVersion, versionManifest,
      ensureVersionManifest, checkModsDirectory } = this.profilesStore
    const { javaArgs, javaPath } = extraJson

    const { accessToken = '', uuid, username, displayName, type } = getCurrentProfile()

    if (!version) {
      version = selectedVersion.lastVersionId
      switch (selectedVersion.type) {
        case 'latest-release':
        case 'latest-snapshot':
          version = selectedVersion.type
      }
    }

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

    const versionRoot = join(VERSIONS_PATH, versionId)
    if (!ret || !ret.isolation) {
      await checkModsDirectory()
      if (await fs.pathExists(MODS_PATH)) {
        const s = await fs.stat(MODS_PATH)
        if (s.isSymbolicLink()) await fs.unlink(MODS_PATH)
      }
      const dest = join(versionRoot, 'mods')
      if (!await fs.pathExists(MODS_PATH) && await fs.pathExists(dest)) await fs.symlink(dest, MODS_PATH, 'dir')
    }
    await pluginMaster.emit('launchEnsureFiles', versionId, versionRoot)

    const option: Launcher.Option = {
      version: versionId,
      javaPath: javaPath || 'java',
      extraJVMArgs: javaArgs.split(' '),
      accessToken: accessToken || '',
      gameProfile: { id: uuid, name: displayName || username },
      properties: {},
      userType: type || 'mojang' as any,
      gamePath: GAME_ROOT,
      extraExecOption: {
        detached: true,
        env: {}
      }
    }
    await pluginMaster.emitSync('preLaunch', versionId, versionRoot, option)
    this.status = STATUS.LAUNCHING
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
    await pluginMaster.emit('postLaunch', versionId, versionRoot, option)
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
