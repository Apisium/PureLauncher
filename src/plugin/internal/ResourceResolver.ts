import { plugin, Plugin, event } from '../Plugin'
import { version } from '../../../package.json'
// import * as T from '../../protocol/types'

@plugin({
  version,
  id: '@pure-launcher/resource-installer',
  description: () => $("PureLauncher's built-in plugin"),
  title: () => $('ResourcesInstaller')
})
export default class ResourceInstaller extends Plugin {
  @event(null, true)
  public async processResourceInstallVersion (r: any) {
    if (r.type !== 'Version') return
    if (typeof r.$fabric === 'object') {
      // r.$fabric
    }
  }
}
