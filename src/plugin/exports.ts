import GameStore, { STATUS } from '../models/GameStore'

export { Plugin, plugin, event } from './Plugin'
export { default as Authenticator } from './Authenticator'
export { default as types } from '../protocol/types'
export { default as Avatar } from '../components/Avatar'
export { default as Dots } from '../components/Dots'
export { default as Dropdown } from '../components/Dropdown'
export { default as Switch } from '../components/Switch'
export { default as ShowMore } from '../components/ShowMore'
export { download, genId, genUUID, getJson, fetchJson, appDir } from '../utils/index'
export { STATUS as LAUNCH_STATUS }

export const $: Window['$'] = (window as any).__$pli0
export const pluginMaster = window.pluginMaster
export const profilesStore = window.profilesStore

const gs = __getStore(GameStore)
export const launch = gs.launch
export const getLaunchStatus = () => gs.status
