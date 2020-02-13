import { plugin, Plugin, event } from '../Plugin'
import { version } from '../../../package.json'
import { isVersion, ResourceVersion } from '../../protocol/types'
import { GAME_ROOT } from '../../constants'
import { getDownloaders } from '../../plugin/DownloadProviders'
import Installer from '@xmcl/installer'
import Task from '@xmcl/task'

interface ForgeFile {
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
  id: '@pure-launcher/resource-installer',
  description: () => $("PureLauncher's built-in plugin"),
  title: () => $('ResourcesInstaller')
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
      await Installer.ForgeInstaller.install({
        installer: r.$forge.installer,
        universal: r.$forge.universal,
        mcversion: r.mcVersion,
        version: r.version
      }, GAME_ROOT, { versionId: r.id })
    } else if (r.$vanilla) {
      obj.notWriteJson = true
      await Task.execute(Installer.Installer.install('client', r.mcVersion, GAME_ROOT, getDownloaders().version))
    }
  }
}
