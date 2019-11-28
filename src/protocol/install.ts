import * as T from './types'

const get = (url: string) => fetch(url).then(r => r.json(), e => {
  console.error(e)
  throw new Error($('Network connection failed!'))
})

export default async ({ resource: r }: T.ProtocolInstall) => {
  if (typeof r === 'string') r = await get(r) as T.AllResources | T.ResourceVersion
  await pluginMaster.emitSync('protocolInstallRequest', r)
  if (await global.__requestInstallResources(r)) await pluginMaster.emitSync('protocolInstallResource', r)
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
}).then(console.log)
