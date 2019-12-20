import Authenticator from './Authenticator'
import internal from './internal/index'
import isDev from '../utils/isDev'
import EventBus, { INTERRUPTIBLE } from '../utils/EventBus'
import { Plugin, EVENTS, PLUGIN_INFO, PluginInfo } from './Plugin'
import { YGGDRASIL, OFFLINE, Yggdrasil, Offline } from './logins'
import { appDir } from '../utils/index'
import { join } from 'path'
import fs from 'fs-extra'

export const PLUGINS_ROOT = join(appDir, 'plugins')

const AUTHENTICATORS = Symbol('Authenticators')
export default class Master extends EventBus {
  public plugins: Record<string, Plugin> = { }
  public logins: Record<string, Authenticator> = { [YGGDRASIL]: new Yggdrasil(), [OFFLINE]: new Offline() }

  public constructor () {
    super()
    internal.forEach(it => this.loadPlugin(it))
    this
      .loadPlugins()
      .catch(console.error)
      .then(() => isDev && process.env.LOAD_PLUGIN && this.loadPlugin(new (require(process.env.LOAD_PLUGIN))()))
      .catch(console.error)
  }

  public getAllProfiles () {
    return Object.values(this.logins).flatMap(it => it.getAllProfiles())
  }
  public getCurrentLogin () {
    const l = this.logins[profilesStore.extraJson.loginType]
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
        const f = p[EVENTS][name] = fn.bind(p)
        if (fn[INTERRUPTIBLE]) f[INTERRUPTIBLE] = true
        this.on(name, f)
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
    if (internal.has(plugin)) throw new Error('Build-in plugins can not be unloaded!')
    const info = this.checkPlugin(plugin)
    await plugin.onUnload()
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

  private async loadPlugins () {
    await fs.ensureDir(PLUGINS_ROOT)
    const deletesFile = join(PLUGINS_ROOT, 'deletes.json')
    if (await fs.pathExists(deletesFile)) {
      const deletes: string[] = await fs.readJson(deletesFile)
      await Promise.all(deletes.map(it => fs.unlink(join(PLUGINS_ROOT, it)).catch()))
      await fs.unlink(deletesFile)
    }
    let plugins: Array<typeof Plugin> = []
    await Promise.all((await fs.readdir(PLUGINS_ROOT))
      .filter(it => it.endsWith('.js') || it.endsWith('.asar'))
      .map(async it => {
        let path = join(PLUGINS_ROOT, it)
        if (it.endsWith('.asar')) {
          const pkg = await fs.readJson(join(path, 'package.json'), { throws: false })
          path = join(path, pkg && pkg.main ? pkg.main : 'index.js')
        }
        try {
          const plugin = require(path)
          const info: PluginInfo = plugin[PLUGIN_INFO]
          if (!info || !info.id) throw new Error('This file is not a plugin!')
          plugins.push(plugin)
        } catch (e) {
          console.error('Fail to load plugin: ' + path, e)
        }
      }))
    plugins = plugins.filter(It => {
      const info = It[PLUGIN_INFO]
      if (Array.isArray(info.dependencies) && info.dependencies.length) return true
      try { this.loadPlugin(new It()) } catch (e) { console.error('Fail to load plugin: ' + info.id, e) }
    }).sort((a, b) => a[PLUGIN_INFO].dependencies.length - b[PLUGIN_INFO].dependencies.length)
    let len = plugins.length
    while (plugins.length && len-- > 0) {
      const temp = plugins.filter(It => {
        const info = It[PLUGIN_INFO]
        if (info.dependencies.some(it => !(it in this.plugins))) return true
        try { this.loadPlugin(new It()) } catch (e) {
          console.error('Fail to load plugin: ' + info.id, e)
          return true
        }
      })
      len -= plugins.length - temp.length
      plugins = temp
    }
    if (plugins.length) {
      const ids = []
      plugins.forEach(it => {
        const info = it[PLUGIN_INFO]
        ids.push(info.id)
        console.warn('Fail to load plugin:', info.id, ', missing dependencies:', info.dependencies.join('|'))
      })
      throw new Error('Fail to load plugins: ' + ids.join(', '))
    }
  }
}
