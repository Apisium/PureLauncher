import { join } from 'path'
import { plugin, Plugin, event } from '../Plugin'
import { version as pluginVersion } from '../../../package.json'
import { isVersion, ResourceVersion } from '../../protocol/types'
import { addTask, download, genId } from '../../utils/index'
import { GAME_ROOT, TEMP_PATH } from '../../constants'
import { getDownloaders, downloader, optifine } from '../../plugin/DownloadProviders'
import { promises as fs } from 'fs'
import * as Installer from '@xmcl/installer/index'

@plugin({
  version: pluginVersion,
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
      const name = r.mcVersion + '-' + r.$optifine[0] + '-' + r.$optifine[1]
      const destination = join(TEMP_PATH, genId())
      try {
        await download(
          {
            destination,
            url: await (profilesStore.downloadProvider.optifine || optifine)(r.mcVersion, r.$optifine[0], r.$optifine[1])
          },
          $('Download') + ' Optifine', name)
        await addTask(Installer.OptifineInstaller.installByInstallerTask(destination, GAME_ROOT, { versionId: r.id }),
          $('Install') + ' Optifine', name).wait()
      } finally {
        await fs.unlink(destination).catch(console.error)
      }
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
      await addTask(Installer.Installer.installTask('client', data, GAME_ROOT, getDownloaders()),
        $('Install') + ' Minecraft', r.mcVersion).wait()
    }
  }
}
