import * as T from '../../src/protocol/types'

const f: Window['fetch'] = (typeof window !== 'undefined' && window.fetch) ||
  (typeof global !== 'undefined' && (global as any).fetch) || (typeof self !== 'undefined' && self.fetch) ||
  this.fetch || eval('require("node-fetch")')
if (!f) throw new Error('Can not find the fetch function.')

let PORT = 46781
export const post = <T> (url: string, body: any) => f(`http://127.0.0.1:${PORT}/${url}`,
  { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
  .then(it => it.json() as Promise<T>)

export const setPort = (port: number) => { PORT = port }
export const reload = () => f(`http://127.0.0.1:${PORT}/reload`).then(it => it.json()).then(it => it.success as boolean)
export const info = () => f(`http://127.0.0.1:${PORT}/info`).then(it => it.json()) as Promise<PureLauncherInfo>
export const protocol = (data: T.Protocol) => post('protocol', data)

/* eslint-disable camelcase */
export interface PureLauncherInfo {
  arch: string
  platform: string
  versions: {
    node: string,
    v8: string,
    uv: string,
    zlib: string,
    brotli: string,
    ares: string,
    modules: string,
    nghttp2: string,
    napi: string,
    llhttp: string,
    http_parser: string,
    openssl: string,
    icu: string,
    unicode: string,
    electron: string,
    chrome: string,
    pure_launcher: string
  }
}