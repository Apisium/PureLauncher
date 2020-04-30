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
import history from './utils/history'
import './protocol/index'
import { join } from 'path'
import { exists } from 'fs'
import { remote, shell } from 'electron'
import { update } from './protocol/check-update'
import { ResourceVersion } from './protocol/types'
import { version } from '../package.json'
import { download, genId, getJson, openServerHome } from './utils/index'
import { TEMP_PATH, DEFAULT_LOCATE, LAUNCHING_IMAGE, LAUNCHER_MANIFEST_URL,
  RESOURCES_VERSIONS_INDEX_PATH, IS_WINDOWS } from './constants'
import { downloader } from './plugin/DownloadProviders'

const main = document.getElementsByTagName('main')[0]
const top = document.getElementById('top')
const logo = document.getElementById('top-logo')
logo.onclick = () => shell.openExternal('https://pl.apisium.cn')

let instance: import('rc-notification/lib/Notification').NotificationInstance
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

const html = document.getElementsByTagName('html')[0]
pluginMaster.once('loaded', () => {
  downloader.syncSockets()
  process.nextTick(() => (html.style.opacity = '1'))
  ReactDOM.render(<App />, document.getElementById('root'), () => {
    const goLeft = document.getElementById('go-left')
    const goRight = document.getElementById('go-right')
    const buttons = document.getElementById('top-buttons')
    const shrink = document.getElementById('shrink')
    const spread = document.getElementById('spread')
    const list = document.getElementById('sidebar-list')
    const switchText = document.getElementById('sidebar-switch')

    window.quitApp = document.getElementById('close').onclick = () => {
      document.getElementById('close').onclick = () => {}
      html.style.opacity = '0'
      setTimeout(() => remote.app.quit(), 1000)
    }
    document.getElementById('hide').onclick = () => remote.getCurrentWindow().minimize()
    goLeft.onclick = () => history.goBack()
    goRight.onclick = () => history.goForward()

    let full = !profilesStore.extraJson.fold
    const content = document.getElementById('main-content')
    shrink.onclick = spread.onclick = () => {
      if (full) {
        full = false
        content.style.opacity = '0'
        topBar.containers[2].style.opacity = '0'
        logo.style.opacity = '0'
        buttons.style.opacity = '0'
        setTimeout(() => {
          switchText.style.display = list.style.display = goLeft.style.display = goRight.style.display = 'none'
          spread.style.display = 'block'
          shrink.style.display = 'none'
          top.style.width = '220px'
          main.style.width = '182px'
          topBar.containers[0].style.width = '220px'
          topBar.containers[1].style.width = '190px'
        }, 700)
        setTimeout(() => {
          remote.getCurrentWindow().setBounds({ width: 240, height: 436 })
          setTimeout(() => (buttons.style.opacity = '1'), 500)
        }, 3500)
      } else {
        full = true
        remote.getCurrentWindow().setBounds({ width: 816, height: 586 })
        top.style.width = ''
        buttons.style.opacity = '0'
        topBar.containers[2].style.display = ''
        main.style.width = ''
        topBar.containers[0].style.width = ''
        topBar.containers[1].style.width = ''
        list.style.display = ''
        setTimeout(() => {
          switchText.style.display = list.style.display = goLeft.style.display = goRight.style.display = ''
          spread.style.display = 'none'
          shrink.style.display = ''
          topBar.containers[2].style.opacity = '1'
          content.style.opacity = '1'
          logo.style.opacity = '1'
          buttons.style.opacity = '1'
        }, 3000)
      }
      if (full === profilesStore.extraJson.fold) profilesStore.setFold(!full)
    }
    if (!full) {
      topBar.containers[2].style.opacity = '0'
      logo.style.opacity = '0'
      switchText.style.display = list.style.display = goLeft.style.display = goRight.style.display = 'none'
      spread.style.display = 'block'
      shrink.style.display = 'none'
      top.style.transition = 'unset'
      top.style.width = '220px'
      main.style.width = '182px'
      topBar.containers[0].style.width = '220px'
      topBar.containers[1].style.width = '190px'
      remote.getCurrentWindow().setBounds({ width: 240, height: 436 })
      process.nextTick(() => (top.style.transition = ''))
    }
    pluginMaster.emit('rendered')
    if (IS_WINDOWS && !remote.systemPreferences.isAeroGlassEnabled()) {
      notice({ content: $('Aero is not enabled in the current system, resulting in abnormal GUI!'), error: true })
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

pluginMaster.once('rendered', () => {
  exists(LAUNCHING_IMAGE, e => {
    if (e) return
    const destination = join(TEMP_PATH, genId())
    getJson(LAUNCHER_MANIFEST_URL)
      .then(it => download({
        destination,
        url: it.launchingImage[+(DEFAULT_LOCATE !== 'zh-cn')],
        checksum: { algorithm: 'sha1', hash: it.launchingImageHash }
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
  console.log(
    `%cPureLauncher%c${version}%c Official website: https://pl.apisium.cn\n%cCopyright © 2020 %cApisium%c. All rights reserved.`,
    'background-color:#096dd9;padding:2px 7px;border-top-left-radius:3px;border-bottom-left-radius:3px',
    'background-color:#389e0d;padding:2px 7px;border-top-right-radius:3px;border-bottom-right-radius:3px',
    '', 'color:#aaa;font-size:.6rem', 'font-size:.7rem;font-weight:bold', 'color:#aaa;font-size:.6rem'
  )

  if (!navigator.onLine) return
  const now = Date.now()
  const updateCheckTime = parseInt(localStorage.getItem('updateCheckTime'))
  if (updateCheckTime && updateCheckTime + 12 * 60 * 60 * 1024 >= now) return
  return update()
})
setInterval(update, 12 * 60 * 60 * 1024)
