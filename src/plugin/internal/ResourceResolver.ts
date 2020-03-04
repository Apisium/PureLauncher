import { plugin, Plugin, event } from '../Plugin'
import { version } from '../../../package.json'
import { isVersion, ResourceVersion } from '../../protocol/types'
import { addTask } from '../../utils/index'
import { GAME_ROOT } from '../../constants'
import { getDownloaders } from '../../plugin/DownloadProviders'
import installLocal, { installMod } from '../../protocol/install-local'
import * as Installer from '@xmcl/installer/index'

interface Forge {
  version: string
  universal: string
  installer: string
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
      r.version = '0.0.0'
      await Installer.FabricInstaller.install(r.$fabric.version, r.$fabric.loader, GAME_ROOT, { versionId: r.id })
    } else if (typeof r.$forge === 'object') {
      obj.notWriteJson = true
      const mv = r.mcVersion
      const v = r.$forge.version
      r.version = '0.0.0'
      await addTask(Installer.ForgeInstaller.installTask({
        version: v,
        mcversion: mv,
        installer: {
          sha1: r.$forge.installer,
          path: `/maven/net/minecraftforge/forge/${mv}-${v}/forge-${mv}-${v}-installer.jar`
        },
        universal: {
          sha1: r.$forge.universal,
          path: `/maven/net/minecraftforge/forge/${mv}-${v}/forge-${mv}-${v}-universal.jar`
        }
      }, GAME_ROOT, { versionId: r.id }), $('Install Forge') + ': ' + v).wait()
    } else if (r.$vanilla) {
      obj.notWriteJson = true
      r.version = '0.0.0'
      await profilesStore.ensureVersionManifest()
      const data = profilesStore.versionManifest.versions.find(it => it.id === r.mcVersion)
      if (!data) throw new Error('No such version: ' + r.mcVersion)
      await addTask(Installer.Installer.installTask('client', data, GAME_ROOT, getDownloaders(data)),
        $('Install Minecraft') + ': ' + r.mcVersion).wait()
    }
  }

  @event()
  public zipDragIn (file: string) {
    notice({ content: $('Installing resources...') })
    installLocal(file, true)
      .then(success => {
        if (success) notice({ content: $('Success!') })
        else notice({ content: $('Failed!') })
      })
      .catch(e => notice({ content: e ? e.message : $('Failed!'), error: true }))
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
