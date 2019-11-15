import Lang from '../lang/zh-cn.json'
import Master from './plugin/index'
import ProfilesStore from './models/ProfilesStore'

type Keys = keyof typeof Lang
interface Ctx { content: React.ReactNode, duration?: number, error?: boolean }
declare global {
  declare const $: (text: Keys, ...args: string[]) => string
  declare const __profilesStore: ProfilesStore
  declare const pluginMaster: Master
  declare const notice: (ctx: Ctx) => void
  declare interface Window {
    $: $
    pluginMaster: Master
    __profilesStore: ProfilesStore
    notice: (ctx: Ctx) => void
  }
  declare module NodeJS {
    interface Global {
      $: $
      pluginMaster: Master
      __profilesStore: ProfilesStore
      notice: (ctx: Ctx) => void
    }
  }
}
