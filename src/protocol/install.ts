import * as T from './types'
import { getJson } from '../utils/index'

export default async ({ resource: r }: T.ProtocolInstall) => {
  try {
    if (typeof r === 'string') r = await getJson(r) as T.AllResources | T.ResourceVersion
    if (!r.id) return
    const obj: T.InstallView<any> = { }
    await pluginMaster.emitSync('protocolInstallProcess', r, obj)
    if (await global.__requestInstallResources(r, obj)) await pluginMaster.emitSync('protocolInstallResource', r)
    notice({ content: $('Successfully installed resources!') })
  } catch (e) {
    console.log(e)
    notice({ error: true, content: $('Failed to install resources!') })
  }
}
(global as any).hhh = () => global.__requestInstallResources({
  id: 'minecraft',
  version: '0.0.1',
  json: { },
  mcVersion: '1.14.4',
  type: 'Version',
  description: '迷你世界真好玩，迷你世界天下第一!',
  title: '迷你世界1.14.4',
  resources: {
    mini: {
      type: 'Mod',
      id: 'mini',
      version: '1.0.0',
      description: '迷你世界真好玩，迷你世界天下第一!',
      title: '迷你世界1.14.4',
      urls: []
    },
    hah: {
      type: 'Server',
      id: 'hah',
      title: '迷你世界1.14.4',
      ip: '127.0.0.1'
    }
  }
} as T.ResourceVersion).then(console.log)
