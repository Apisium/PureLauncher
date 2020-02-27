import { plugin, Plugin, event } from '../Plugin'
import { version } from '../../../package.json'
import { isVersion, ResourceVersion } from '../../protocol/types'
import { addTask } from '../../utils/index'
import { GAME_ROOT } from '../../constants'
import { getDownloaders } from '../../plugin/DownloadProviders'
import Installer from '@xmcl/installer/index'

interface ForgeFile {
  sha1: ''
  md5: string
  path: string
}

interface Forge {
  version: string
  universal: ForgeFile
  installer: ForgeFile
}

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
      $fabric?: { version: string, loader: string }
      $forge?: Forge
      $vanilla?: boolean
    } = res
    if (typeof r.$fabric === 'object') {
      obj.notWriteJson = true
      await Installer.FabricInstaller.install(r.$fabric.version, r.$fabric.loader, GAME_ROOT, { versionId: r.id })
    } else if (typeof r.$forge === 'object') {
      obj.notWriteJson = true
      r.$forge.universal.sha1 = r.$forge.installer.sha1 = ''
      const { version: v, mcVersion: mv } = r
      r.$forge.installer.path = `/maven/net/minecraftforge/forge/${mv}-${v}/forge-${mv}-${v}-installer.jar`
      r.$forge.universal.path = `/maven/net/minecraftforge/forge/${mv}-${v}/forge-${mv}-${v}-universal.jar`
      await addTask(Installer.ForgeInstaller.installTask({
        version: v,
        mcversion: mv,
        installer: r.$forge.installer,
        universal: r.$forge.universal
      }, GAME_ROOT, { versionId: r.id }), $('Install Forge') + ': ' + v).wait()
    } else if (r.$vanilla) {
      obj.notWriteJson = true
      await profilesStore.ensureVersionManifest()
      const data = profilesStore.versionManifest.versions.find(it => it.id === r.mcVersion)
      if (!data) throw new Error('No such version: ' + r.mcVersion)
      await addTask(Installer.Installer.installTask('client', data, GAME_ROOT, getDownloaders()),
        $('Install Minecraft') + ': ' + r.mcVersion).wait()
    }
  }
}
