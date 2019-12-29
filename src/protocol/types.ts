import { ReactElement } from 'react'
import { valid } from 'semver'

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
  json: string | object
  mcVersion: string
  resources?: Record<string, AllResources> | string
  files?: Record<string, string>
  source?: string
  website?: string
  api?: string[]
  hashes?: string[]
  extends?: string | ResourceVersion
  updateUrl?: string
}
export interface ResourceMod extends Resource<'Mod'> {
  version: string
  urls: string[]
  source?: string
  website?: string
  mcVersion?: string
  apis?: MinecraftApis
  hashes?: string[]
  extends?: string | ResourceMod
  updateUrl?: string
}
export interface ResourceResourcesPack extends Resource<'ResourcesPack'> {
  version: string
  urls: string[]
  source?: string
  website?: string
  hashes?: string[]
  extends?: string | ResourceResourcesPack
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
  hash?: string
  extension?: string
  dependencies?: Record<string, ResourcePlugin | string>
}
export type AllResources = ResourceMod | ResourceResourcesPack | ResourceServer | ResourcePlugin
export const isResource = (r: any): r is Resource => !!(typeof r === 'object' && typeof r.id === 'string' &&
  r.i && typeof r.type === 'string' && r.type)
export const isResourceWithVersion = (r: any): r is Resource & { version: string } =>
  isResource(r) && !!(valid((r as any).version))
export const isResourceWithVersionAndUrls = (r: any): r is Resource & { version: string, urls: string[] } =>
  isResourceWithVersion(r) && Array.isArray((r as any).urls)
export const isResourcesPack = (r: any): r is ResourceResourcesPack => isResourceWithVersionAndUrls(r) &&
  r.type === 'ResourcesPack'
export const isMod = (r: any): r is ResourceMod => isResourceWithVersionAndUrls(r) &&
  r.type === 'Mod'
export const isPlugin = (r: any): r is ResourcePlugin => isResourceWithVersion(r) &&
  r.type === 'Plugin' && typeof (r as any).url === 'string' && !!(r as any).url
export const isVersion = (r: any): r is ResourceVersion => isResourceWithVersion(r) &&
  r.type === 'Version' && (typeof (r as any).json === 'object' || typeof (r as any).json === 'string') &&
  (r as any).json && !!valid((r as any).mcVersion)
export const isServer = (r: any): r is ResourceServer => isResource(r) &&
  r.type === 'Server' && typeof (r as any).ip === 'string' && !!(r as any).ip

export interface Protocol <T = any> { type: T }
export interface ProtocolLaunch extends Protocol<'Launch'> {
  version?: string | ResourceVersion
  options?: { ip: string, port?: number }
  autoInstall?: boolean
}
export interface ProtocolInstall extends Protocol<'Install'> {
  resource: string | AllResources | ResourceVersion
}
export interface InstallView {
  [key: string]: any
  [key: number]: any
  throws?: boolean
  request?: boolean
  render?: (...args: any[]) => ReactElement
}
