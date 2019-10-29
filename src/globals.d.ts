import Lang from '../lang/zh-cn.json'
import Master from './plugin/index'
import ProfilesModel from './models/ProfilesModel'

type Keys = keyof typeof Lang
interface Ctx { content: React.ReactNode, duration?: number, error?: boolean }
declare global {
  declare const $: (text: Keys, ...args: string[]) => string
  declare const __profilesModel: () => ProfilesModel
  declare const pluginMaster: Master
  declare const notice: (ctx: Ctx) => void
  declare interface Window {
    $: $
    pluginMaster: Master
    __profilesModel: () => ProfilesModel
    notice: (ctx: Ctx) => void
  }
  declare module NodeJS {
    interface Global {
      $: $
      pluginMaster: Master
      __profilesModel: () => ProfilesModel
      notice: (ctx: Ctx) => void
    }
  }
}
