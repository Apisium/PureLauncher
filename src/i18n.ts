import zhCN from '../lang/zh-cn.json'
import moment from 'moment'
import forceUpdate from 'react-deep-force-update'

export const langs = {
  'zh-cn': zhCN,
  'en-us': { $LanguageName$: 'English' }
}

let instance: any
export const setInstance = (instance2: any) => void (instance = instance2)

let current = zhCN

export const applyLocate = (name: string, notUpdate: boolean = false) => {
  if (!(name in langs)) throw new Error('No such lang: ' + name)
  current = langs[name]
  moment.locale(name)
  if (!notUpdate) forceUpdate(instance.current)
}

declare const $: (text: keyof typeof zhCN, ...args: string[]) => string
;(window as any).$ = (text: keyof typeof zhCN, ...args: string[]) =>
  text in current ? current[text].replace(/{(\d)}/, (_, i) => args[i]) : text
