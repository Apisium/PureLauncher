import { ResourcePlugin } from '../protocol/types'
import { INTERRUPTIBLE } from '../utils/EventBus'

export const EVENTS = Symbol('Events')
export const EXTENSION_BUTTONS = Symbol('ExtensionsButton')
export const ROUTES = Symbol('Pages')
export const PLUGIN_INFO = Symbol('PluginInfo')
export interface ExtensionsButton {
  title: () => string
  key: any
  onClick?: () => void
  icon?: string
  hideFirst?: boolean
}
export type PluginInfo = Pick<ResourcePlugin, Exclude<keyof ResourcePlugin, 'type' | 'url' | 'dependencies' | 'extension'>>
  & { dependencies?: string[] }
export class Plugin {
  public static [PLUGIN_INFO]: PluginInfo = null
  public [ROUTES]: Set<JSX.Element> = null
  public [EXTENSION_BUTTONS]: Set<ExtensionsButton> = null
  public onUnload () { }
  public addExtensionsButton (opt: ExtensionsButton) {
    pluginMaster.addExtensionsButton(opt)
    if (!this[EXTENSION_BUTTONS]) this[EXTENSION_BUTTONS] = new Set()
    this[EXTENSION_BUTTONS].add(opt)
    return this
  }
  public addRoute (route: JSX.Element) {
    pluginMaster.addRoute(route)
    if (!this[ROUTES]) this[ROUTES] = new Set()
    this[ROUTES].add(route)
    return this
  }
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
