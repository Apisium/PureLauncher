import { ResourcePlugin } from '../protocol/types'
import { INTERRUPTIBLE } from '../utils/EventBus'

export const EVENTS = Symbol('Events')
export const PLUGIN_INFO = Symbol('PluginInfo')
export interface ExtensionsButton {
  title: () => string
  key: any
  onClick?: () => void
  icon?: string
  hideFirst?: boolean
}
export type PluginInfo = Pick<ResourcePlugin,
  Exclude<keyof ResourcePlugin, 'type' | 'url' | 'dependencies' | 'extension' | 'title' | 'description' | 'hash'>> &
  { title (): string, description? (): string }
  & { dependencies?: string[] }
export class Plugin {
  public static [PLUGIN_INFO]: PluginInfo = null
  public readonly pluginInfo: PluginInfo = null
  public onUnload () { }
}
export const event = (name?: string, interruptible = false) => (target: any, key: string, d: PropertyDescriptor) => {
  const f = d.value
  if (interruptible) f[INTERRUPTIBLE] = true
  ;(target[EVENTS] || (target[EVENTS] = {}))[name || key] = f
}
export const plugin = (info: PluginInfo) => <T extends typeof Plugin> (c: T) => {
  if (c === Plugin) throw new TypeError('Please extends the Plugin class!')
  if (!info.id) throw new Error('this plugin without id!')
  c[PLUGIN_INFO] = Object.freeze(info)
  return c
}
