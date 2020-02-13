import { Store, injectStore } from 'reqwq'
import { LaunchOption, Version, launch } from '@xmcl/core'
import { Installer } from '@xmcl/installer'
import { getVersionTypeText } from '../utils/index'
import { GAME_ROOT } from '../constants'
import { version as launcherBrand } from '../../package.json'
import { remote, ipcRenderer } from 'electron'
import { getDownloaders } from '../plugin/DownloadProviders'
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
          await this.ensureMinecraftVersion(versionManifest.versions.find(v => v.id === versionId))
          break
        case 'latest-snapshot':
          await ensureVersionManifest()
          versionId = versionManifest.latest.snapshot
          await this.ensureMinecraftVersion(versionManifest.versions.find(v => v.id === versionId))
          break
        default:
          versionId = version
          await this.ensureLocalVersion(versionId)
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

      const option: LaunchOption = {
        launcherBrand,
        properties: {},
        version: versionId,
        gamePath: GAME_ROOT,
        userType: 'mojang' as any,
        launcherName: 'pure-launcher',
        versionType: getVersionTypeText(),
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
      if (extraJson.animation) {
        setTimeout(() => ipcRenderer.send('open-launching-dialog'), 3000)
        stopAnimation()
      }

      try {
        const p = await launch(option)
        p.once('close', (code, signal) => {
          if (code !== 0) {
            // this.error = ({ code: m.data.code, signal: m.data.signal })
          }
          ipcRenderer.send('close-launching-dialog')
          if (this.profilesStore.extraJson.animation) startAnimation()
          if (currentWindow.isMinimized()) {
            currentWindow.restore()
            currentWindow.setSize(816, 586)
          }
          this.status = STATUS.READY
          console.log('exit', code, signal)
        })
        await pluginMaster.emit('postLaunch', p, versionId, option)
      } catch (e) {
        if (typeof e === 'object' && e.error) {
          switch (e.error) {
            case 'MissingLibs':
              getDownloaders() // TODO: download and relaunch
              return
            case 'CorruptedLibs': // TODO: download and notice
              return
            case 'CorruptedVersionJar': // TODO: download and notice
              return
          }
        }
        throw e
      }
    } catch (e) {
      notice({ content: $('Fail to launch!'), error: true })
      this.status = STATUS.READY
      ipcRenderer.send('close-launching-dialog')
      if (currentWindow.isMinimized()) {
        currentWindow.restore()
        currentWindow.setSize(816, 586)
      }
      throw e
    }
  }
  private async ensureMinecraftVersion (version: any /* TODO: need a type */) {
    const task = Installer.installTask('client', version, GAME_ROOT, getDownloaders().versions)
    await Task.execute(task)
  }
  private async ensureLocalVersion (versionId: string) {
    const resolved = await Version.parse(GAME_ROOT, versionId)
    const task = Installer.installDependenciesTask(resolved, getDownloaders().versions)
    await Task.execute(task)
  }
}
