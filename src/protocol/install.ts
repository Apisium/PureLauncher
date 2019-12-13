import * as T from './types'
import { getJson } from '../utils/index'

export default async ({ resource: r }: T.ProtocolInstall, request = true) => {
  try {
    if (typeof r === 'string') r = await getJson(r) as T.AllResources | T.ResourceVersion
    if (!r.id) return
    const obj: T.InstallView = { }
    await pluginMaster.emitSync('protocolInstallProcess', r, obj)
    if (request && !await global.__requestInstallResources(r, obj)) return
    await pluginMaster.emitSync('protocolInstallResource', r, obj)
    notice({ content: $('Successfully installed resources!') })
  } catch (e) {
    console.error(e)
    notice({ error: true, content: $('Failed to install resources!') })
  }
}
