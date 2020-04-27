import 'moment/locale/zh-cn'
import zhCN from '../langs/zh-cn.json'
import moment from 'moment'
import forceUpdate from 'react-deep-force-update'
import { RefObject } from 'react'

export const langs = {
  'zh-cn': zhCN,
  'en-us': { $LanguageName$: 'English' }
}

let instance: RefObject<any>
export const setInstance = (instance2: RefObject<any>) => (instance = instance2)

let current = zhCN
export let currentName = 'zh-cn'

export const applyLocate = (name: string, notUpdate = false) => {
  name = name.toLowerCase()
  if (!(name in langs)) throw new Error('No such lang: ' + name)
  current = langs[name]
  moment.locale(name)
  currentName = name
  if (window.pluginMaster) pluginMaster.emit('changeLanguage', name)
  if (!notUpdate) forceUpdate(instance.current)
}
export const replaceArgs = (text: string, ...args: string[]) => text.replace(/{(\d)}/g, (_, i) => args[i])
;(window as any).__$pli0 = (text: keyof typeof zhCN, ...args: string[]) =>
  text in current
    ? replaceArgs(current[text], ...args)
    : text.startsWith('$')
      ? text === '$readme'
        ? replaceArgs(zhCN.$readmeEn, ...args)
        : null
      : replaceArgs(text, ...args)
