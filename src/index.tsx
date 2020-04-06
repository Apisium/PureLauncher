/* eslint-disable node/no-deprecated-api */
import './index.css'
import './utils/hacks'
import './utils/isDev'
import './plugin/index'
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import fs from 'fs-extra'
import Notification from 'rc-notification'
import './protocol/index'
import { join } from 'path'
import { exists } from 'fs'
import { remote, shell } from 'electron'
import { update } from './protocol/check-update'
import { ResourceVersion } from './protocol/types'
import { download, genId, getJson, openServerHome } from './utils/index'
import { TEMP_PATH, DEFAULT_LOCATE, LAUNCHING_IMAGE, LAUNCHER_MANIFEST_URL,
  RESOURCES_VERSIONS_INDEX_PATH } from './constants'

const main = document.getElementsByTagName('main')[0]
const top = document.getElementById('top')
const logo = document.getElementById('top-logo')
logo.onclick = () => shell.openExternal('https://pl.apisium.cn')

let instance: any
Notification.newInstance({ getContainer: () => document.body }, it => (instance = it))
window.notice = (ctx: { content: React.ReactNode, duration?: number, error?: boolean }) => {
  if (!ctx.duration) ctx.duration = 5
  const ac = ctx as any
  ac.style = { }
  if (ctx.error) {
    ac.style.backgroundColor = '#d4441a'
    ac.style.color = '#fff'
    if (typeof ctx.content === 'string') ctx.content = $('Error') + ': ' + ctx.content
  }
  instance.notice(ctx)
}

pluginMaster.once('loaded', () => {
  process.nextTick(() => (document.getElementsByTagName('html')[0].style.opacity = '1'))
  ReactDOM.render(<App />, document.getElementById('root'), () => {
    pluginMaster.emit('rendered')
    let full = true
    const content = document.getElementById('main-content')
    if (process.platform === 'win32' && !remote.systemPreferences.isAeroGlassEnabled()) {
      notice({ content: $('Aero is not enabled in the current system, resulting in abnormal GUI!'), error: true })
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onclick = () => {
      if (full) {
        full = false
        content.style.opacity = '0'
        topBar.containers[2].style.opacity = '0'
        logo.style.opacity = '0'
        setTimeout(() => {
          top.style.width = '220px'
          main.style.width = '180px'
          topBar.containers[0].style.width = '220px'
          topBar.containers[1].style.width = '180px'
        }, 700)
        setTimeout(() => remote.getCurrentWindow().setSize(240, 586), 4000)
      } else {
        full = true
        setTimeout(() => {
          remote.getCurrentWindow().setSize(816, 586)
          top.style.width = ''
          topBar.containers[2].style.display = ''
          main.style.width = ''
          topBar.containers[0].style.width = ''
          topBar.containers[1].style.width = ''
          setTimeout(() => {
            topBar.containers[2].style.opacity = '1'
            content.style.opacity = '1'
            logo.style.opacity = '1'
          }, 3000)
        }, 1000)
      }
    }
  })
})

const clickSound = new Audio(require('./assets/sounds/click.ogg'))
clickSound.oncanplay = () => document.addEventListener('click', e => {
  if (!window.profilesStore?.extraJson?.soundOn) return
  const t = e.target as HTMLElement
  if (t.tagName === 'BUTTON' || t.tagName === 'A' || t.dataset.sound || t.parentElement?.dataset.sound) {
    clickSound.play().catch(() => {})
  }
})

document.getElementById('close').onclick = () => setTimeout(() => remote.app.quit(), 1000)
document.getElementById('hide').onclick = () => remote.getCurrentWindow().minimize()

pluginMaster.once('rendered', () => {
  exists(LAUNCHING_IMAGE, e => {
    if (e) return
    const destination = join(TEMP_PATH, genId())
    getJson(LAUNCHER_MANIFEST_URL)
      .then(it => download({
        destination,
        url: it.launchingImage[+(DEFAULT_LOCATE !== 'zh-cn')],
        checksum: { algorithm: 'sha1', hash: it.launchingImageSha1 }
      }, $('Launching Animation'), 'launching.webp'))
      .then(() => fs.move(destination, LAUNCHING_IMAGE))
      .catch(console.error)
      .then(() => fs.pathExists(destination))
      .then(ex => ex && fs.unlink(destination))
      .catch(console.error)
  })
  profilesStore.resolveVersion(profilesStore.selectedVersion.key)
    .then(rid => fs.readJson(RESOURCES_VERSIONS_INDEX_PATH)
      .then((it: Record<string, ResourceVersion>) => it && it[rid] && openServerHome(it[rid].serverHome))
    )
    .catch(() => {})
  if (!navigator.onLine) return
  const now = Date.now()
  const updateCheckTime = parseInt(localStorage.getItem('updateCheckTime'))
  if (updateCheckTime && updateCheckTime + 12 * 60 * 60 * 1024 >= now) return
  return update()
})
setInterval(update, 12 * 60 * 60 * 1024)
