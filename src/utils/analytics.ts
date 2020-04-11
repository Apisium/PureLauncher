import uuid from 'uuid-by-string'
import GoogleAnalytics from 'google-analytics-lite/dist/esnext/index'
import { version as av } from '../../package.json'

export const genUUIDOrigin = (t?: string) => uuid(t || (Math.random().toString() + Math.random().toString()))
export const pagesFilter: Array<(path: string | null, source: string) => string | null> = [
  (_, path) => path.startsWith('/manager/mods/') ? '/manager/mods' : path
]

let token = localStorage.getItem('analyticsToken')
if (!token) localStorage.setItem('analyticsToken', (token = genUUIDOrigin()))
const ga = new GoogleAnalytics('UA-155613176-1', token)
Object.assign(ga.defaultValues, {
  av,
  ds: 'app',
  ul: navigator.languages[0],
  an: 'PureLauncher',
  aid: 'cn.apisium.purelauncher'
})
const f = ga.pageView
ga.pageView = (dl: string, dh?: string, dt?: string, other?: any) => {
  if (dh) {
    dh = pagesFilter.reduce((p, fn) => fn(p, dh), dh)
    return dh ? f.call(ga, dl, dh, dt, other) : Promise.resolve(true)
  }
  return f.call(ga, dl, dh, dt, other)
}

export default ga
