import P from '../models/index'
import GameStore, { STATUS } from '../models/GameStore'
import PluginMaster from './index'
import ProfileStore from '../models/ProfilesStore'
import * as skinView3d from 'skinview3d'
import * as ReactCache from 'react-cache-enhance'
import * as IconButtonExports from '../components/IconButton'
import * as constants from '../constants'
import * as Reqwq from 'reqwq'
import * as Launcher from '@xmcl/launch'
import * as Installer from '@xmcl/installer'
import * as Version from '@xmcl/version'
import * as Task from '@xmcl/task'
import * as ResourcePack from '@xmcl/resourcepack'

export { version } from '../../package.json'
export { Plugin, plugin, event } from './Plugin'
export { default as Authenticator } from './Authenticator'
export { default as types } from '../protocol/types'
export { default as fitText } from '../utils/fit-text'
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
export { default as ReactRouter } from 'react-router-dom'
export { default as IconPicker, resolveIcon } from '../components/IconPicker'
export { download, genId, genUUID, genUUIDOrigin, getJson, fetchJson, makeTempDir, cacheSkin, getJavaVersion,
  DownloadItem, validPath, sha1, md5, replace, getVersionTypeText, removeFormatCodes } from '../utils/index'
export { STATUS as LAUNCH_STATUS, IconButtonExports, skinView3d, ReactCache, constants, Reqwq, ProfileStore }

export const $: Window['$'] = (window as any).__$pli0
export const pluginMaster: PluginMaster = window.pluginMaster
export const profilesStore: ProfileStore = window.profilesStore
export const notice: (ctx: { content: React.ReactNode, duration?: number, error?: boolean }) => void = null
export const openConfirmDialog: (data: { text: string, title?: string, cancelButton?: boolean }) =>
  Promise<boolean> = null
export const xmcl = {
  Launcher,
  Installer,
  Version,
  Task,
  ResourcePack
}

const gs = P.getStore(GameStore)
export const launch = gs.launch
export const getLaunchStatus = () => gs.status
Object.defineProperty(module.exports, 'notice', { get: () => window.notice })
Object.defineProperty(module.exports, 'openConfirmDialog', { get: () => window.openConfirmDialog })
