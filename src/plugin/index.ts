import Authenticator from './Authenticator'
import EventBus from '../utils/EventBus'
import { Plugin, EVENTS, PLUGIN_INFO, PluginInfo, WillUnloadable } from './Plugin'
import { YGGDRASIL, OFFLINE, Yggdrasil, Offline } from './logins'

const AUTHENTICATORS = Symbol('Authenticators')
export default class Master extends EventBus {
  public plugins: Record<string, Plugin> = { }
  public logins: Record<string, Authenticator> = { [YGGDRASIL]: new Yggdrasil(), [OFFLINE]: new Offline() }
  public getAllProfiles () {
    return Object.values(this.logins).flatMap(it => it.getAllProfiles())
  }
  public getCurrentLogin () {
    const l = this.logins[__profilesStore.extraJson.loginType]
    if (l) return l
    else throw new Error('') // TODO: show a dialog
  }

  public loadPlugin (p: Plugin) {
    if (!(p instanceof Plugin)) throw new Error('Load plugin fail!')
    const c = p.constructor
    if (!(PLUGIN_INFO in c)) throw new Error('Load plugin fail!')
    const info: PluginInfo = c[PLUGIN_INFO]
    if (!info.id || info.id in this.plugins) throw new Error('Load plugin fail!')
    if (EVENTS in p) {
      Object.entries<Function>(p[EVENTS]).forEach(([name, fn]) => {
        if (typeof fn !== 'function') return
        this.on(name, p[EVENTS][name] = fn.bind(p))
      })
    }
    this.plugins[info.id] = p
  }

  public registerAuthenticator (name: string, plugin: Plugin, a: Authenticator) {
    if (!(a instanceof Authenticator)) throw new TypeError('arg 1 is not an Authenticator!')
    if (name in this.logins) throw new Error(`the Authenticator (${name}) is already exists!`)
    this.checkPlugin(plugin)
    this.logins[name] = a
    ;(plugin[AUTHENTICATORS] || (plugin[AUTHENTICATORS] = [])).push(name)
  }

  public async unloadPlugin (plugin: Plugin) {
    const info = this.checkPlugin(plugin)
    if ('willUnload' in plugin) await (plugin as WillUnloadable).willUnload()
    if (EVENTS in plugin) Object.entries<any>(plugin[EVENTS]).forEach(([name, fn]) => this.off(name, fn))
    if (AUTHENTICATORS in plugin) plugin[AUTHENTICATORS].forEach((it: string) => delete this.logins[it])
    delete this.plugins[info.id]
  }

  private checkPlugin (plugin: Plugin) {
    if (!(plugin instanceof Plugin)) throw new Error('No such plugin!')
    const c = plugin.constructor
    if (!(PLUGIN_INFO in c)) throw new Error('No such plugin!')
    const info: PluginInfo = c[PLUGIN_INFO]
    if (!info.id || plugin !== this.plugins[info.id]) throw new Error('No such plugin!')
    return info
  }
}
