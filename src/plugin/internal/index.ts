import { Plugin } from '../Plugin'
import ResourceInstaller from './ResourceInstaller'
import ResourceResolver from './ResourceResolver'

const map = {
  resourceInstaller: ResourceInstaller,
  resourceResolver: ResourceResolver
}

const _plugins: { [k in keyof typeof map]: InstanceType<(typeof map)[k]> } = { } as any

export default Object.freeze(new Set<Plugin>(Object.entries(map).map(([key, C]) => (_plugins[key] = new C()))))
export const plugins = Object.freeze(_plugins)
