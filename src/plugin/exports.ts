import P from '../models/index'
import GameStore, { STATUS } from '../models/GameStore'
import PluginMaster from './index'
import ProfilesStore from '../models/ProfilesStore'
import * as fs from 'fs-extra'
import * as skinView3d from 'skinview3d'
import * as IconButtonExports from '../components/IconButton'
import * as constants from '../constants'
import * as Reqwq from 'reqwq'
import * as Nbt from '@xmcl/nbt/index'
import * as Core from '@xmcl/core/index'
import * as Task from '@xmcl/task/index'
import * as Unzip from '@xmcl/unzip/index'
import * as Client from '@xmcl/client/index'
import * as Installer from '@xmcl/installer/index'
import * as ResourcePack from '@xmcl/resourcepack/index'
import * as TextComponent from '@xmcl/text-component/index'
import * as Authenticator from './Authenticator'
import * as Yazl from 'yazl'
import * as Yauzl from 'yauzl'
import * as types from '../protocol/types'
import * as ReactRouter from 'react-router-dom'
import * as ofs from '../utils/fs'

export { version } from '../../package.json'
export { Plugin, plugin, event } from './Plugin'
export { openLoginDialog } from '../components/LoginDialog'
export { default as fitText } from '../utils/fit-text'
export { default as requestReload } from '../utils/request-reload'
export { default as Avatar } from '../components/Avatar'
export { default as Loading } from '../components/Loading'
export { default as Dots } from '../components/Dots'
export { default as locates } from '../utils/locates'
export { default as Dropdown } from '../components/Dropdown'
export { default as Switch } from '../components/Switch'
export { default as ShowMore } from '../components/ShowMore'
export { default as Empty } from '../components/Empty'
export { default as Treebeard } from '../components/treebeard/index'
export { default as DownloadProviders, DownloadProvider } from './DownloadProviders'
export { default as createVersionSelector } from '../components/VersionSelector'
export { default as IconButton } from '../components/IconButton'
export { default as ErrorHandler } from '../components/ErrorHandler'
export { default as LiveRoute } from '../components/LiveRoute'
export { default as protocolFunctions } from '../protocol/index'
export { default as isDev } from '../utils/isDev'
export { default as history } from '../utils/history'
export { default as React } from 'react'
export { default as urlJoin } from 'url-join'
export { default as ReactDOM } from 'react-dom'
export { default as Dialog } from 'rc-dialog'
export { default as Notification } from 'rc-notification'
export { default as ToolTip } from 'rc-tooltip'
export { default as ReactImage } from 'react-image'
export { default as IconPicker, resolveIcon } from '../components/IconPicker'
export { genId, genUUID, genUUIDOrigin, getJson, fetchJson, makeTempDir, cacheSkin,
  isX64, createUnzipTask, openServerHome, getJavaVersion, validPath, sha1, md5, replace, createShortcut,
  getVersionTypeText, download, getSuitableMemory, unzip, playNoticeSound, removeFormatCodes, reloadPage,
  autoNotices, readBuffer, addTask, createDownloadTask, addDirectoryToZipFile } from '../utils/index'
export { STATUS as LAUNCH_STATUS, IconButtonExports, skinView3d, ofs,
  constants, Reqwq, ProfilesStore, Authenticator, fs, Yazl, Yauzl, types, ReactRouter }

export const $: (name: string, ...args: string[]) => string = (window as any).__$pli0
export const pluginMaster: PluginMaster = window.pluginMaster
export const profilesStore: ProfilesStore = window.profilesStore
export const notice: (ctx: { content: React.ReactNode, duration?: number, error?: boolean }) => void = null
export const openConfirmDialog: (data: { text: string, title?: string, cancelButton?: boolean, ignore?: boolean }) =>
  Promise<boolean> = null
export const requestInstallResources: <T extends types.Resource> (data: T, views?: types.InstallView) =>
  Promise<boolean> = null
export const xmcl = {
  Nbt,
  Core,
  Task,
  Unzip,
  Client,
  Installer,
  ResourcePack,
  TextComponent
}

const gs = P.getStore(GameStore)
export const launch = gs.launch
export const resolveJavaPath = gs.resolveJavaPath
export const getLaunchStatus = () => gs.status
Object.defineProperty(module.exports, 'notice', { get: () => window.notice })
Object.defineProperty(module.exports, 'openConfirmDialog', { get: () => window.openConfirmDialog })
Object.defineProperty(module.exports, 'requestInstallResources', { get: () => window.__requestInstallResources })
