/* eslint-disable node/no-deprecated-api */
import { join } from 'path'
import { exists } from 'fs'
import { Server } from 'http'
import { app, BrowserWindow, ipcMain, systemPreferences } from 'electron'
import minimist from 'minimist'
import isDev from './utils/isDev'
import createServer from './createServer'

let server: Server = null
let window: BrowserWindow = null
let launchingWindow: BrowserWindow = null
const webp = join(app.getPath('userData'), 'launching.webp')
;(process.env as any)['D' + 'EV'] = process.env.NODE_ENV !== 'production'

const parseArgs = (args: string[]) => {
  if (window) {
    const arr = minimist(args.slice(1))._
    const data = arr[arr.length - 1]
    if (data) window.webContents.send('pure-launcher-protocol', data, arr)
  }
}

if (app.requestSingleInstanceLock()) {
  app.on('second-instance', (_, argv) => {
    if (window) {
      if (window.isMinimized()) {
        window.restore()
        window.setBounds({ height: 586, width: 816 })
      }
      window.focus()
      parseArgs(argv)
    } else app.exit()
  })
} else app.exit()

app.setAsDefaultProtocolClient('pure-launcher')

let launchingDialogOpened = false
const closeLaunchingDialog = () => {
  if (!launchingWindow || !launchingDialogOpened) return
  launchingDialogOpened = false
  launchingWindow.webContents.executeJavaScript('window.img.style.opacity = "0"')
  setTimeout(() => {
    launchingWindow.hide()
    launchingWindow.webContents.executeJavaScript('window.img.src = ""')
  }, 3000)
}
const openLaunchingDialog = () => {
  if (!launchingWindow || launchingDialogOpened) return
  exists(webp, e => {
    if (!e) return
    launchingDialogOpened = true
    launchingWindow.show()
    launchingWindow.webContents.executeJavaScript(`
if (!window.img) window.img = document.getElementsByTagName("img")[0]
window.img.src = '${webp.replace(/\\/g, '\\\\')}'
window.img.style.opacity = '1'`)
    setTimeout(closeLaunchingDialog, 26000)
  })
}

const create = () => {
  ipcMain
    .on('open-launching-dialog', openLaunchingDialog)
    .on('close-launching-dialog', closeLaunchingDialog)
  window = new BrowserWindow({
    width: 816,
    height: 586,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    transparent: process.platform !== 'win32' || systemPreferences.isAeroGlassEnabled(),
    frame: false,
    show: false,
    webPreferences: { webviewTag: true, nodeIntegration: true, nodeIntegrationInWorker: true }
  })
  window.loadFile(join(__dirname, '../index.html'))

  launchingWindow = new BrowserWindow({
    width: 500,
    height: 441,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    transparent: true,
    frame: false,
    title: 'Launching...',
    show: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: { webSecurity: false }
  })
  launchingWindow.webContents.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(
    '<!DOCTYPE html><html style="pointer-events:none"><head><meta charset="UTF-8"><link rel="preload" href="' + webp +
    '"></head><body style="margin:0;overflow:hidden"><img style="transition:3s;filter:drop-shadow(0 4px 8px #0000008a);opacity:0"></body></html>'))

  window
    .once('ready-to-show', () => window.show())
    .once('closed', () => (window = null))
    .webContents.on('will-navigate', (e, u) => {
      const url = new URL(u)
      const url1 = new URL(window.webContents.getURL())
      if (url.origin !== url1.origin || url.pathname !== url1.pathname) e.preventDefault()
    })
  if (isDev) window.webContents.openDevTools({ mode: 'detach' })
  parseArgs(process.argv)

  server = createServer(window)
}

if (process.platform === 'linux') app.commandLine.appendSwitch('enable-transparent-visuals')

app
  .on('ready', process.platform === 'linux' ? () => setTimeout(create, 400) : create)
  .on('quit', () => server.close())
  .on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
  .on('activate', () => window == null && create())
