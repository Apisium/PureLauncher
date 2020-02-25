/* eslint-disable node/no-deprecated-api */
import { join, basename } from 'path'
import { exists } from 'fs'
import { app, BrowserWindow, ipcMain, webContents, DownloadItem as IDownloadItem, WebContents } from 'electron'
import minimist from 'minimist'
import isDev from './utils/isDev'
import createServer from './createServer'

let window: BrowserWindow = null
let downloadWindow: BrowserWindow = null
let launchingWindow: BrowserWindow = null
let downloadViewer: WebContents = null
const webp = join(app.getPath('userData'), 'launching.webp')
;(process.env as any)['D' + 'EV'] = process.env.NODE_ENV !== 'production'

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
      window.img.style.opacity = '1'
    `)
    setTimeout(closeLaunchingDialog, 26000)
  })
}

interface Item { file: string, url: string, instance?: any, length?: number }
interface DownloadItem {
  multiple?: boolean
  alive?: number
  name?: string
  finished?: number
  stopped?: boolean
  file?: string
  sentProgress?: boolean
  next: () => void
  item: Item | Item[]
}

const parseArgs = (args: string[]) => {
  if (window) {
    const data = minimist(args.slice(1))._[0]
    window.webContents.send('pure-launcher-protocol', data)
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
    }
    parseArgs(argv)
  })
} else app.quit()

app.setAsDefaultProtocolClient('pure-launcher')

const sendToAll = (...args: any[]) => webContents.getAllWebContents().forEach(it => it.send.apply(it, args))

const create = () => {
  downloadWindow = new BrowserWindow({ width: 1, height: 1, show: false })
  const ctx = downloadWindow.webContents
  const downloadItems: Record<string, DownloadItem> = { }
  ipcMain
    .on('open-launching-dialog', openLaunchingDialog)
    .on('close-launching-dialog', closeLaunchingDialog)
    .on('download-window-loaded', (e, id) => {
      downloadViewer = webContents.fromId(id).once('destroyed', () => (downloadViewer = null))
      if (process.env.DOWNLOAD_DEV) downloadViewer.openDevTools()
      e.reply('download-items', Object.entries(downloadItems)
        .map(([id, { name, file, stopped }]) => ({ id, name, file, stopped })))
    })
    .on('cancel-download', (_, id) => {
      const obj = downloadItems[id]
      if (obj && !obj.stopped) {
        ((obj.multiple ? obj.item : [obj.item]) as Item[]).forEach(it => it.instance && it.instance.cancel())
      }
    })
    .on('download', (_, id, item: DownloadItem['item'], name) => {
      if (!id || !item) throw new Error('Url is not exists.')
      const obj = downloadItems[id] = { item, name } as DownloadItem
      try {
        if (Array.isArray(item)) {
          const urls = item.map((it, cid) => {
            const u = new URL(it.url)
            u.hash = id + '|' + cid
            return u.href
          }).values()
          obj.multiple = true
          obj.alive = 0
          obj.finished = 0
          obj.stopped = false
          obj.sentProgress = false
          obj.file = item.slice(3).map(it => basename(it.file)).join(', ')
          const next = obj.next = () => {
            if (obj.stopped) return
            const g = urls.next()
            if (!g.done) {
              ctx.downloadURL(g.value)
              obj.alive++
            }
          }
          for (let j = 0; j < 5; j++) next()
        } else {
          const u = new URL(item.url)
          u.hash = id
          ctx.downloadURL(u.href)
          obj.file = basename(item.file)
        }
        if (downloadViewer) downloadViewer.send('start-download', id, obj.file, name)
      } catch (e) {
        console.log(e)
      }
    })
  const items = new Set<IDownloadItem>()
  ctx.session.on('will-download', (e, i) => {
    const [id, cid] = new URL(i.getURL()).hash.slice(1).split('|', 2)
    const obj = downloadItems[id]
    const item = cid ? obj.item[parseInt(cid, 10)] : obj.item
    item.instance = i
    i.setSavePath(item.file)
    if (obj.multiple && !obj.sentProgress) {
      obj.sentProgress = true
      sendToAll('progress', id, 0)
    }
    i
      .on('updated', (_, state) => {
        if (state === 'interrupted') {
          obj.stopped = true
          sendToAll('download-end', id, 2)
          items.delete(i)
          item.instance = null
          delete downloadItems[id]
        } else if (!obj.multiple && downloadViewer) {
          downloadViewer.send('progress', id, i.getReceivedBytes() / i.getTotalBytes() * 100 | 0)
        }
      })
      .once('done', (_, state) => {
        items.delete(i)
        item.instance = null
        switch (state) {
          case 'completed':
            if (obj.multiple) {
              if (!obj.stopped) {
                if (++obj.finished >= obj.item.length) sendToAll('download-end', id, 0)
                else {
                  sendToAll('progress', id, obj.finished / obj.item.length * 100 | 0)
                  obj.next()
                }
              }
            } else {
              obj.stopped = true
              obj.finished = 1
              sendToAll('download-end', id, 0)
            }
            break
          case 'cancelled':
            if (!obj.stopped) {
              obj.stopped = true
              sendToAll('download-end', id, 1)
              delete downloadItems[id]
            }
            break
          case 'interrupted':
            if (!obj.stopped) {
              obj.stopped = true
              sendToAll('download-end', id, 2)
              delete downloadItems[id]
            }
            break
        }
      })
    items.add(i)
  })
  window = new BrowserWindow({
    width: 816,
    height: 586,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    transparent: true,
    frame: false,
    show: false,
    webPreferences: { webviewTag: true, nodeIntegration: true, nodeIntegrationInWorker: true }
  })
  window.loadFile('./dist/index.html')

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

  const timer = setInterval(() => {
    if (items.size) {
      let total = 0
      let current = 0
      items.forEach(it => {
        total += it.getTotalBytes()
        current += it.getReceivedBytes()
      })
      window.setProgressBar(current / total)
    } else window.setProgressBar(-1)
  }, 1000)
  window
    .once('ready-to-show', () => window.show())
    .once('closed', () => {
      clearInterval(timer)
      window = null
    })
    .webContents.on('will-navigate', (e, u) => {
      const url = new URL(u)
      const url1 = new URL(window.webContents.getURL())
      if (url.origin !== url1.origin || url.pathname !== url1.pathname) e.preventDefault()
    })
  if (isDev) window.webContents.openDevTools()
  parseArgs(process.argv)

  createServer(window)
}

app
  .on('ready', create)
  .on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
  .on('activate', () => window == null && create())
