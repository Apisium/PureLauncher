import { plugin, Plugin, event } from '../Plugin'
import { version } from '../../../package.json'
import { isVersion, ResourceVersion } from '../../protocol/types'
import { addTask } from '../../utils/index'
import { GAME_ROOT } from '../../constants'
import { getDownloaders, downloader, optifine } from '../../plugin/DownloadProviders'
import { installMod } from '../../protocol/install-local'
import * as Installer from '@xmcl/installer/index'

@plugin({
  version,
  id: '@pure-launcher/resource-resolver',
  description: () => $("PureLauncher's built-in plugin"),
  title: () => $('ResourcesResolver')
})
export default class ResourceInstaller extends Plugin {
  @event(null, true)
  public async processResourceInstallVersion (res: any, obj: { notWriteJson: boolean }) {
    if (!isVersion(res) || !res.mcVersion) return
    const r: ResourceVersion & {
      $fabric?: [string, string]
      $forge?: string
      $optifine?: [string, string]
      $vanilla?: boolean
    } = res
    if (Array.isArray(r.$fabric)) {
      obj.notWriteJson = true
      r.version = '0.0.0'
      await Installer.FabricInstaller.install(r.$fabric[0], r.$fabric[1], GAME_ROOT, { versionId: r.id })
    } else if (Array.isArray(r.$optifine)) {
      obj.notWriteJson = true
      r.version = '0.0.0'
      await addTask(Installer.OptifineInstaller.installOptifineTask(
        await (profilesStore.downloadProvider.optifine || optifine)(r.mcVersion, r.$optifine[0], r.$optifine[1]),
        GAME_ROOT,
        { versionId: r.id }
      ), $('Install') + ' Optifine', r.mcVersion + '-' + r.$optifine[0] + '-' + r.$optifine[1]).wait()
    } else if (typeof r.$forge === 'string') {
      obj.notWriteJson = true
      const mv = r.mcVersion
      const version = r.$forge
      r.version = '0.0.0'
      await addTask(Installer.ForgeInstaller.installTask({
        version,
        mcversion: mv,
        installer: {
          path: `/maven/net/minecraftforge/forge/${mv}-${version}/forge-${mv}-${version}-installer.jar`
        },
        universal: {
          path: `/maven/net/minecraftforge/forge/${mv}-${version}/forge-${mv}-${version}-universal.jar`
        }
      }, GAME_ROOT, {
        downloader,
        versionId: r.id,
        java: profilesStore.extraJson.javaPath,
        mavenHost: profilesStore.downloadProvider.forge
      }), $('Install') + ' Forge', mv + '-' + version).wait()
    } else if (r.$vanilla) {
      obj.notWriteJson = true
      r.version = '0.0.0'
      await profilesStore.ensureVersionManifest()
      const data = profilesStore.versionManifest.versions.find(it => it.id === r.mcVersion)
      if (!data) throw new Error('No such version: ' + r.mcVersion)
      await addTask(Installer.Installer.installTask('client', data, GAME_ROOT, getDownloaders(data)),
        $('Install') + ' Minecraft', r.mcVersion).wait()
    }
  }

  @event()
  public fileDragIn (file: File) {
    notice({ content: $('Installing resources...') })
    installMod(file.path)
      .then(success => {
        if (success) notice({ content: $('Success!') })
        else notice({ content: $('Failed!') })
      })
      .catch(e => notice({ content: e ? e.message : $('Failed!'), error: true }))
  }
}
