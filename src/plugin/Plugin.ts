import { ResourcePlugin } from '../protocol/types'
import { INTERRUPTIBLE } from '../utils/EventBus'

export const EVENTS = Symbol('Events')
export const PLUGIN_INFO = Symbol('PluginInfo')
export type PluginInfo = Pick<ResourcePlugin, Exclude<keyof ResourcePlugin, 'type' | 'url' | 'dependencies' | 'extension'>>
  & { dependencies?: string[] }
export class Plugin {
  public static [PLUGIN_INFO]: PluginInfo = null
  public onUnload () { }
}
export const event = (name?: string, interruptible = false) => (target: any, key: string, d: PropertyDescriptor) => {
  const f = d.value
  if (interruptible) f[INTERRUPTIBLE] = true
  ;(target[EVENTS] || (target[EVENTS] = {}))[name || key] = f
}
export const plugin = (info: PluginInfo) => <T extends typeof Plugin> (c: T) => {
  if (!info.id) throw new Error('this plugin without id!')
  c[PLUGIN_INFO] = Object.freeze(info)
  return c
}
