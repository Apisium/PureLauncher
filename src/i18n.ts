import zhCN from '../lang/zh-cn.json'
import moment from 'moment'
import forceUpdate from 'react-deep-force-update'

export const langs = {
  'zh-cn': zhCN,
  'en-us': { $LanguageName$: 'English' }
}

let instance: any
export const setInstance = (instance2: any) => (instance = instance2)

let current = zhCN
export let currentName = 'zh-cn'

export const applyLocate = (name: string, notUpdate = false) => {
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
