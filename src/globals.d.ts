import Lang from '../lang/zh-cn.json'
import Master from './plugin/index'
import ProfilesStore from './models/ProfilesStore'
import { GetStore } from 'reqwq'
import { Resources, Resource, InstallView } from './protocol/types'

type Keys = keyof typeof Lang
interface Ctx { content: React.ReactNode, duration?: number, error?: boolean }
interface ConfirmCtx { text: string, title?: string, cancelButton?: boolean }
declare global {
  declare const __DEV__: boolean
  declare const $: (text: Keys, ...args: string[]) => string
  declare const profilesStore: ProfilesStore
  declare const pluginMaster: Master
  declare const __getStore: GetStore
  declare const notice: (ctx: Ctx) => void
  declare const installResources: (data: Resources) => Promise<void>
  declare const __requestInstallResources: (data: Resources, views?: InstallView) => Promise<boolean>
  declare const openConfirmDialog: (data: ConfirmCtx) => Promise<boolean>
  declare interface Window {
    $: $
    __DEV__: boolean
    pluginMaster: Master
    profilesStore: ProfilesStore
    __getStore: GetStore
    notice: (ctx: Ctx) => void
    installResources: (data: Resources) => Promise<void>
    __requestInstallResources: <T extends Resource> (data: Resource, views?: InstallView<T>) => Promise<boolean>
    openConfirmDialog: (data: ConfirmCtx) => Promise<boolean>
  }
  declare namespace NodeJS {
    interface Global {
      $: $
      __DEV__: boolean
      __getStore: GetStore
      pluginMaster: Master
      profilesStore: ProfilesStore
      notice: (ctx: Ctx) => void
      installResources: (data: Resources) => Promise<void>
      __requestInstallResources: <T extends Resource> (data: Resource, views?: InstallView<T>) => Promise<boolean>
      openConfirmDialog: (data: ConfirmCtx) => Promise<boolean>
    }
  }
}
