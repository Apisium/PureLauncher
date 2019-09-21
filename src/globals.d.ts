import lang from '../lang/zh-cn.json'

declare global {
  declare const $: (text: keyof typeof lang, ...args: string[]) => string
  declare interface Window {
    $: $
  }
  declare module NodeJS {
    interface Global {
      $: $
    }
  }
}
