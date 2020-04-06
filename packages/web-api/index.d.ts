import { queryStatus } from '@xmcl/client'
import * as T from '../../src/protocol/types'

export * from '../../src/protocol/types'

/* eslint-disable camelcase */
export interface PureLauncherInfo {
  isDev: boolean
  devPlugin: string
  arch: string
  platform: string
  versions: {
    node: string
    v8: string
    uv: string
    zlib: string
    brotli: string
    ares: string
    modules: string
    nghttp2: string
    napi: string
    llhttp: string
    http_parser: string
    openssl: string
    icu: string
    unicode: string
    electron: string
    chrome: string
    pure_launcher: string
  }
}

export const post: <T = any> (url: string, body: any) => Promise<T>
export const setPort: (port: number) => void
export const getPort: () => number
export const reload: () => Promise<boolean>
export const info: () => Promise<PureLauncherInfo>
export const protocol: (data: T.Protocol) => Promise<any>
export const setDevPlugin: (path: string) => Promise<boolean>
export const isRunning: () => Promise<boolean>
export const ensureRunning: (time?: number) => Promise<void>
export const queryMinecraftServer: typeof queryStatus
export const getAccount: () => Promise<{ uuid: string, name: string, type: string, skinUrl?: string }>
