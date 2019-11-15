export interface MinecraftApis { [id: string]: string }
export interface Resource <T = any> { type: T }
export interface ResourceVersion extends Resource<'version'> {
  id: string
  version: string
  json: string | object
  mcVersion: string
  resources?: AllResources[]
  urls?: string[]
  title?: string
  author?: string
  source?: string
  website?: string
  api?: string[]
  hashes?: string[]
  extends?: string | ResourceVersion
  updateUrl?: string
}
export interface ResourceMod extends Resource<'mod'> {
  id: string
  version: string
  urls: string[]
  title?: string
  author?: string
  source?: string
  website?: string
  mcVersion?: string
  api?: MinecraftApis
  hashes?: string[]
  extends?: string | ResourceMod
  updateUrl?: string
}
export interface ResourceResourcesPack extends Resource<'resourcesPack'> {
  id: string
  version: string
  urls: string[]
  title?: string
  author?: string
  source?: string
  website?: string
  hashes?: string[]
  extends?: string | ResourceResourcesPack
  updateUrl?: string
}
export interface ResourceServer extends Resource<'server'> {
  ip: string
  port?: number
}
export type AllResources = ResourceMod | ResourceResourcesPack | ResourceServer

export interface Protocol <T = any> { type: T }
export interface ProtocolLaunch extends Protocol<'launch'> {
  version?: string | ResourceVersion
  options?: { ip: string, port?: number }
  autoInstall?: boolean
}
export interface ProtocolInstall extends Protocol<'install'> {
  resource: string | AllResources | ResourceVersion
}
