import lang from '../lang/zh-cn.json'
import Master from './plugin/index'
import ProfilesModel from './models/ProfilesModel'

declare global {
  declare const $: (text: keyof typeof lang, ...args: string[]) => string
  declare const __profilesModel: () => ProfilesModel
  declare const pluginMaster: Master
  declare interface Window {
    $: $
    pluginMaster: Master
    __profilesModel: () => ProfilesModel
  }
  declare module NodeJS {
    interface Global {
      $: $
      pluginMaster: Master
      __profilesModel: () => ProfilesModel
    }
  }
}
