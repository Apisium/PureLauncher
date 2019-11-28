import Lang from '../lang/zh-cn.json'
import Master from './plugin/index'
import ProfilesStore from './models/ProfilesStore'
import { Resources } from './protocol/types'

type Keys = keyof typeof Lang
interface Ctx { content: React.ReactNode, duration?: number, error?: boolean }
interface ConfirmCtx { text: string, title?: string, cancelButton?: boolean }
declare global {
  declare const $: (text: Keys, ...args: string[]) => string
  declare const __profilesStore: ProfilesStore
  declare const pluginMaster: Master
  declare const notice: (ctx: Ctx) => void
  declare const installResources: (data: Resources) => Promise<void>
  declare const __requestInstallResources: (data: Resources) => Promise<boolean>
  declare const openConfirmDialog: (data: ConfirmCtx) => Promise<boolean>
  declare interface Window {
    $: $
    pluginMaster: Master
    __profilesStore: ProfilesStore
    notice: (ctx: Ctx) => void
    installResources: (data: Resources) => Promise<void>
    __requestInstallResources: (data: Resource) => Promise<boolean>
    openConfirmDialog: (data: ConfirmCtx) => Promise<boolean>
  }
  declare module NodeJS {
    interface Global {
      $: $
      pluginMaster: Master
      __profilesStore: ProfilesStore
      notice: (ctx: Ctx) => void
      installResources: (data: Resources) => Promise<void>
      __requestInstallResources: (data: Resource) => Promise<boolean>
      openConfirmDialog: (data: ConfirmCtx) => Promise<boolean>
    }
  }
}
