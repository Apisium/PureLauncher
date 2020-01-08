import GA from 'electron-google-analytics'
import { version } from '../../package.json'
import { genUUIDOrigin } from './index'

let token = localStorage.getItem('AnalyticsToken')
if (!token) localStorage.setItem('AnalyticsToken', (token = genUUIDOrigin()))
const user: {
  set (key: string, value: string): void
  pageview (url: string | null, path: string, title?: string): Promise<any>
  pageView (path: string): Promise<any>
  event (name: string, action: string): Promise<any>
} = new GA('UA-155613176-1')
user.set('cid', token)
user.set('ds', 'app')
user.set('ul', navigator.languages[0])
user.set('an', 'PureLauncher')
user.set('aid', 'cn.apisium.purelauncher')
user.set('av', version)
user.pageView = (path: string, title?: string) => user.pageview(null, path, title)

export default user
