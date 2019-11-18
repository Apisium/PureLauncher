import * as T from './types'

const get = (url: string) => fetch(url).then(r => r.json(), e => {
  console.error(e)
  throw new Error($('Network connection failed!'))
})
export default async ({ resource: r }: T.ProtocolInstall) => {
  if (typeof r === 'string') r = await get(r) as T.AllResources | T.ResourceVersion
  switch (r.type) {
    case 'server':
  }
}
