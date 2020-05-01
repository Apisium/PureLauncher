import * as T from './types'
import user from '../utils/analytics'
import { getJson } from '../utils/index'
import { remote } from 'electron'

const win = remote.getCurrentWindow()
export default <R extends T.Resource> (
  r: R | string,
  request = true,
  throws = true,
  checker: (r: any) => boolean = T.isResource,
  obj: T.InstallView = { },
  pluginsNotInstalled = false
) => {
  const p = (async () => {
    if (typeof r === 'string') r = await getJson(r) as R
    if (!checker(r)) return
    obj.request = request
    obj.throws = throws
    obj.type = r.type
    await pluginMaster.emitSync('protocolPreInstallResource', r, obj)
    if (request) {
      win.flashFrame(true)
      win.moveTop()
      const req = await global.__requestInstallResources(r, obj)
      if (pluginsNotInstalled) return req
      if (!req) throw new Error($('canceled'))
      user.event('resource', 'install').catch(console.error)
      notice({ content: $('Installing resources...') })
    }
    await pluginMaster.emitSync('protocolInstallResource', r, obj)
  })()
  if (!throws) {
    p.then(() => notice({ content: $('Successfully installed resources!') }), e => {
      console.error(e)
      notice({ error: true, content: $('Failed to install resources') + ': ' + (e?.message || $('Unknown')) })
    })
  }
  return p
}
