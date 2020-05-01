import { ReactElement } from 'react'
import { md5 } from '../utils/index'
import { LaunchOption } from '@xmcl/core/index'
import valid from 'semver/functions/valid'
import major from 'semver/functions/major'

export type LaunchExtraOptions = Pick<LaunchOption, 'isDemo' | 'server' | 'resolution'>

export type MinecraftApis = Record<string, string>
export interface Resource <T extends string = string> {
  type: T
  id: string
  time?: number
  title?: string
  author?: string
  description?: string
}
export interface ResourceVersion extends Resource<'Version'> {
  version: string
  json?: string | Record<string | number, any>
  mcVersion: string
  resources?: Record<string, AllResources> | string
  files?: Record<string, string>
  source?: string
  website?: string
  api?: string[]
  hashes?: string[]
  extends?: string | ResourceVersion
  updateUrl?: string
  isolation?: boolean
  icon?: string
  useIdAsName?: boolean
  serverHome?: string
  needRename?: string
  loginType?: string
  server?: LaunchOption['server']
}
export interface ResourceMod extends Resource<'Mod'> {
  version: string
  urls: string[]
  source?: string
  website?: string
  mcVersion?: string
  apis?: MinecraftApis
  hashes?: string[]
  extends?: Record<string, string | ResourceMod>
  updateUrl?: string
}
export interface ResourceWorld extends Resource<'World'> {
  version: string
  url: string
  source?: string
  website?: string
  hash?: string
}
export interface ResourceResourcePack extends Resource<'ResourcePack'> {
  version: string
  urls: string[]
  source?: string
  website?: string
  hashes?: string[]
  extends?: Record<string, string | ResourceResourcePack>
  updateUrl?: string
}
export interface ResourceShaderPack extends Resource<'ShaderPack'> {
  version: string
  urls: string[]
  source?: string
  website?: string
  hashes?: string[]
  extends?: Record<string, string | ResourceResourcePack>
  updateUrl?: string
}
export interface ResourceServer extends Resource<'Server'> {
  ip: string
  port?: number
  hideAddress?: boolean
}
export interface ResourcePlugin extends Resource<'Plugin'> {
  version: string
  url: string
  source?: string
  website?: string
  hash: string
  extension?: string
  updateUrl?: string
  dependencies?: Record<string, ResourcePlugin | string>
}
export type AllResources = ResourceMod | ResourceResourcePack | ResourceServer | ResourceWorld
export const isResource = (r: any): r is Resource => !!(typeof r === 'object' && typeof r.id === 'string' &&
  r.id && typeof r.type === 'string' && r.type)
export const isResourceWithVersion = (r: any): r is Resource & { version: string } =>
  isResource(r) && !!valid((r as any).version)
export const isResourceWithVersionAndUrls = (r: any): r is Resource & { version: string, urls: string[] } =>
  isResourceWithVersion(r) && Array.isArray((r as any).urls)
export const isResourcePack = (r: any): r is ResourceResourcePack => isResourceWithVersionAndUrls(r) &&
  r.type === 'ResourcePack'
export const isMod = (r: any): r is ResourceMod => isResourceWithVersionAndUrls(r) &&
  r.type === 'Mod'
export const isWorld = (r: any): r is ResourceWorld => isResourceWithVersion(r) &&
  r.type === 'World' && (r as any).url && typeof (r as any).url === 'string'
export const isPlugin = (r: any): r is ResourcePlugin => isResourceWithVersion(r) &&
  r.type === 'Plugin' && typeof (r as any).url === 'string' && !!(r as any).url &&
  typeof (r as any).hash === 'string' && !!(r as any).hash
export const isVersion = (r: any): r is ResourceVersion => {
  const a: any = r
  if (!isResource(r) || r.type !== 'Version' || typeof a.mcVersion !== 'string' || !a.mcVersion) return false
  if (a.$vanilla) return true
  if (typeof (r as any).$forge === 'string') return true
  const fabric = (r as any).$fabric
  if (Array.isArray(fabric) && typeof fabric[0] === 'string' && typeof fabric[1] === 'string') return true
  const optifine = (r as any).$optifine
  if (Array.isArray(optifine) && typeof optifine[0] === 'string' && typeof optifine[1] === 'string') return true
  if (isResourceWithVersion(r) && (typeof a.json === 'object' || (typeof a.json === 'string' && a.json))) return true
  return false
}
export const isServer = (r: any): r is ResourceServer => isResource(r) &&
  r.type === 'Server' && typeof (r as any).ip === 'string' && !!(r as any).ip

export interface Protocol <T = any> {
  type: T
  plugins?: Record<string, string | ResourcePlugin>
}
export interface ProtocolLaunch extends Protocol<'Launch'> {
  version?: string
  resource?: ResourceVersion | string
  secret?: string
  options?: LaunchExtraOptions
  noAutoInstall?: boolean
}
export interface ProtocolInstall extends Protocol<'Install'> {
  resource: string | AllResources | ResourceVersion | ResourcePlugin
}
export interface InstallView {
  [key: string]: any
  [key: number]: any
  throws?: boolean
  request?: boolean
  type?: string
  render?: (...args: any[]) => ReactElement
}

export const resolveVersionId = (r: ResourceVersion) => {
  const ar: any = r
  return r.useIdAsName || (ar.$fabric || ar.$forge || ar.$optifine || ar.$vanilla) ? r.id
    : `${r.mcVersion}-${md5(r.id).slice(0, 6)}-${major(r.version)}`
}
