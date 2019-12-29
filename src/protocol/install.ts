import * as T from './types'
import { getJson } from '../utils/index'

export default (
  r: T.Resource | string,
  request = true,
  throws = true,
  checker: (r: any) => boolean = T.isResource,
  obj: T.InstallView = { }
) => {
  const p = (async () => {
    if (typeof r === 'string') r = await getJson(r) as T.Resource
    if (!checker(r)) return
    obj.request = request
    obj.throws = throws
    await pluginMaster.emitSync('protocolInstallProcess', r, obj)
    if (request && !await global.__requestInstallResources(r, obj)) return
    await pluginMaster.emitSync('protocolInstallResource', r, obj)
  })()
  if (!throws) {
    p.then(() => notice({ content: $('Successfully installed resources!') }), e => {
      console.error(e)
      notice({ error: true, content: $('Failed to install resources!') })
    })
  }
  return p
}
