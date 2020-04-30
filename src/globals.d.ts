import Lang from '../langs/zh-cn.json'
import Master from './plugin/index'
import ProfilesStore from './models/ProfilesStore'
import { GetStore } from 'reqwq'
import { ComponentType } from 'react'
import { PureLauncherTask } from './utils/index'
import { Resources, Resource, InstallView } from './protocol/types'

type Keys = keyof typeof Lang
type $ = (name: Keys, ...args: string[]) => string
interface Ctx { content: React.ReactNode, duration?: number, error?: boolean }
interface ConfirmCtx { text: string, title?: string, cancelButton?: boolean, component?: ComponentType, ignore?: boolean }
interface TopBar { blocks: Array<HTMLDivElement[]>, colors: Array<string[]>, containers: HTMLDivElement[] }
declare global {
  declare const topBar: TopBar
  declare const __DEV__: boolean
  declare const $: $
  declare const profilesStore: ProfilesStore
  declare const pluginMaster: Master
  declare const __getStore: GetStore
  declare const __tasks: PureLauncherTask[]
  declare const notice: (ctx: Ctx) => void
  declare const installResources: (data: Resources) => Promise<void>
  declare const __requestInstallResources: (data: Resources, views?: InstallView) => Promise<boolean>
  declare const openConfirmDialog: (data: ConfirmCtx) => Promise<boolean>
  declare const startAnimation: () => void
  declare const stopAnimation: () => void
  declare const animationStopped: boolean
  declare const __updateTasksView: (() => void) | null
  declare const quitApp: () => void
  declare interface Window {
    $: $
    topBar: TopBar
    __DEV__: boolean
    pluginMaster: Master
    profilesStore: ProfilesStore
    __getStore: GetStore
    animationStopped: boolean
    notice: (ctx: Ctx) => void
    __tasks: PureLauncherTask[]
    installResources: (data: Resources) => Promise<void>
    __requestInstallResources: <T extends Resource> (data: Resource, views?: InstallView<T>) => Promise<boolean>
    openConfirmDialog: (data: ConfirmCtx) => Promise<boolean>
    startAnimation: () => void
    stopAnimation: () => void
    quitApp: () => void
    __updateTasksView: (() => void) | null
  }
  declare namespace NodeJS {
    interface Global {
      $: $
      topBar: TopBar
      __DEV__: boolean
      __getStore: GetStore
      pluginMaster: Master
      profilesStore: ProfilesStore
      animationStopped: boolean
      notice: (ctx: Ctx) => void
      __tasks: PureLauncherTask[]
      installResources: (data: Resources) => Promise<void>
      __requestInstallResources: <T extends Resource> (data: Resource, views?: InstallView<T>) => Promise<boolean>
      openConfirmDialog: (data: ConfirmCtx) => Promise<boolean>
      startAnimation: () => void
      stopAnimation: () => void
      quitApp: () => void
      __updateTasksView: (() => void) | null
    }
  }
}
