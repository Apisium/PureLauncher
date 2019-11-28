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
  resources?: Record<string, AllResources>
  urls?: string[]
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
}
export interface ResourcePlugin extends Resource<'Plugin'> {
  version: string
  url: string
  source?: string
  website?: string
  hash?: string
}
export type AllResources = ResourceMod | ResourceResourcesPack | ResourceServer | ResourcePlugin

export interface Protocol <T = any> { type: T }
export interface ProtocolLaunch extends Protocol<'Launch'> {
  version?: string | ResourceVersion
  options?: { ip: string, port?: number }
  autoInstall?: boolean
}
export interface ProtocolInstall extends Protocol<'Install'> {
  resource: string | AllResources | ResourceVersion
}
