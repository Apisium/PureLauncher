import { Plugin } from '../Plugin'
import ResourceInstaller from './ResourceInstaller'

const map = {
  resourceInstaller: ResourceInstaller
}

const _plugins: { [k in keyof typeof map]: InstanceType<(typeof map)[k]> } = { } as any

export default Object.freeze(new Set<Plugin>(Object.entries(map).map(([key, C]) => (_plugins[key] = new C()))))
export const plugins = Object.freeze(_plugins)
