import { Plugin } from '../Plugin'
import ResourceInstaller from './ResourceInstaller'

export default Object.freeze(new Set<Plugin>([ResourceInstaller].map(It => new It())))
