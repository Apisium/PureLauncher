import { plugin, Plugin, event } from '../Plugin'
import { version } from '../../../package.json'
import * as T from '../../protocol/types'

@plugin({ id: '@pure-launcher/resource-installer', version, description: $("PureLauncher's built-in plugin") })
export default class ResourceInstaller extends Plugin {
  @event()
  public async protocolInstallResource (r: T.AllResources | T.ResourceVersion) {
    switch (r.type) {
      case 'Server':
        // TODO:
        break
      case 'Mod':
        // TODO:
        break
      case 'ResourcesPack':
        // TODO:
        break
      case 'Plugin':
        // TODO:
        break
      case 'Version':
        // TODO:
        break
    }
  }
}
