import lang from '../lang/zh-cn.json'

declare const $: (text: keyof typeof lang, ...args: string[]) => string
;(window as any).$ = (text: keyof typeof lang, ...args: string[]) =>
  text in lang ? lang[text].replace(/{(\d)}/, (_, i) => args[i]) : text
