import { replaceArgs } from '../i18n'

export type Locates <T extends object> = T & {
  setCurrentLanguage (name?: string): void
  (key: keyof T, ...args: any[]): 233
}

export default <T extends object> (langs: Record<string, T>, defaultLanguage = 'zh-cn') => {
  let currentLanguage = langs[defaultLanguage]
  if (!currentLanguage) throw new Error('The default language name ' + defaultLanguage + ' is not exists!')
  const setCurrentLanguage = (name?: string) => {
    currentLanguage = langs[name] || langs[this.defaultLanguage]
  }
  return new Proxy(Function.prototype, {
    get: (_, name) => name === 'setCurrentLanguage' ? setCurrentLanguage : currentLanguage[name],
    apply (_, __, args) {
      args[0] = currentLanguage[args[0]]
      return args[0] ? replaceArgs.apply(null, args) : ''
    }
  }) as any as Locates<T>
}
