import P from '../models/index'
import GameStore, { STATUS } from '../models/GameStore'
import * as skinView3d from 'skinview3d'
import * as ReactCache from 'react-cache-enhance'
import * as IconButtonExports from '../components/IconButton'

export { Plugin, plugin, event } from './Plugin'
export { default as Authenticator } from './Authenticator'
export { default as types } from '../protocol/types'
export { default as Avatar } from '../components/Avatar'
export { default as Dots } from '../components/Dots'
export { default as Dropdown } from '../components/Dropdown'
export { default as Switch } from '../components/Switch'
export { default as ShowMore } from '../components/ShowMore'
export { default as Empty } from '../components/Empty'
export { default as Treebeard } from '../components/treebeard/index'
export { default as createVersionSelector } from '../components/VersionSelector'
export { default as IconButton } from '../components/IconButton'
export { default as LiveRoute } from '../components/LiveRoute'
export { default as installResource } from '../protocol/index'
export { default as isDev } from '../utils/isDev'
export { default as history } from '../utils/history'
export { default as React } from 'react'
export { default as ReactDOM } from 'react-dom'
export { default as Dialog } from 'rc-dialog'
export { default as Notification } from 'rc-notification'
export { default as ToolTip } from 'rc-tooltip'
export { default as ReactImage } from 'react-image'
export { default as TextFit } from 'react-textfit'
export { default as ReactRouter } from 'react-router-dom'
export { download, genId, genUUID, getJson, fetchJson, appDir, makeTempDir,
  DownloadItem, validPath, sha1, md5, replace } from '../utils/index'
export { STATUS as LAUNCH_STATUS, IconButtonExports, skinView3d, ReactCache }

export const $: Window['$'] = (window as any).__$pli0
export const pluginMaster = window.pluginMaster
export const profilesStore = window.profilesStore
export const notice = window.notice
export const openConfirmDialog = window.openConfirmDialog

const gs = P.getStore(GameStore)
export const launch = gs.launch
export const getLaunchStatus = () => gs.status
