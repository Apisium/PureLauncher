import P from '../models/index'
import GameStore, { STATUS } from '../models/GameStore'

export { Plugin, plugin, event } from './Plugin'
export { default as Authenticator } from './Authenticator'
export { default as types } from '../protocol/types'
export { default as Avatar } from '../components/Avatar'
export { default as Dots } from '../components/Dots'
export { default as Dropdown } from '../components/Dropdown'
export { default as Switch } from '../components/Switch'
export { default as ShowMore } from '../components/ShowMore'
export { default as createVersionSelector } from '../components/VersionSelector'
export { default as installResource } from '../protocol/index'
export { download, genId, genUUID, getJson, fetchJson, appDir, makeTempDir, DownloadItem } from '../utils/index'
export { STATUS as LAUNCH_STATUS }

export const $: Window['$'] = (window as any).__$pli0
export const pluginMaster = window.pluginMaster
export const profilesStore = window.profilesStore
export const notice = window.notice
export const openConfirmDialog = window.openConfirmDialog

const gs = P.getStore(GameStore)
export const launch = gs.launch
export const getLaunchStatus = () => gs.status
