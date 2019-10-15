import lang from '../lang/zh-cn.json'
import Master from './plugin/index'
import ProfilesModel from './models/ProfilesModel'

interface Ctx { content: React.ReactNode, duration?: number, error?: boolean }
declare global {
  declare const $: (text: keyof typeof lang, ...args: string[]) => string
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
