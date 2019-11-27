import { basename } from 'path'
import { version } from '../package.json'
import { app, BrowserWindow, ipcMain, webContents } from 'electron'
import minimist from 'minimist'
import Koa from 'koa'
import Router from 'koa-router'
import koaBody from 'koa-body'

let window: BrowserWindow = null
let downloadWindow: BrowserWindow = null

interface Item { file: string, url: string, instance?: any, length?: number }
interface DownloadItem {
  multiple?: boolean
  alive?: number
  name?: string
  finished?: number
  stopped?: boolean
  file?: string
  next: () => void
  item: Item | Item[]
}

const info = {
  versions: { ...process.versions, pure_launcher: version },
  platform: process.platform,
  arch: process.arch
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
      if (window.isMinimized()) window.restore()
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
  let downloadViewer
  ipcMain
    .on('download-window-loaded', (e, id) => {
      downloadViewer = webContents.fromId(id).once('did-navigate', () => (downloadViewer = null))
      if (process.env.DOWNLOAD_DEV) downloadViewer.openDevTools()
      e.reply('download-items', Object.entries(downloadItems).map(([id, { name, file }]) => ({ id, name, file })))
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
  const items = new Set()
  ctx.session.on('will-download', (e, i) => {
    const [id, cid] = new URL(i.getURL()).hash.slice(1).split('|', 2)
    const obj = downloadItems[id]
    const item = cid ? obj.item[parseInt(cid, 10)] : obj.item
    item.instance = i
    i.setSavePath(item.file)
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
            } else sendToAll('download-end', id, 0)
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
  if (process.env.DEV || !app.isPackaged) window.webContents.openDevTools()
  parseArgs(process.argv)

  const router = new Router()
    .post('/protocol', ctx => {
      window.webContents.send('pure-launcher-protocol', ctx.request.body)
      ctx.body = { success: true }
    })
    .get('/info', ctx => {
      ctx.body = info
    })
  if (process.env.DEV) {
    router.get('/reload', ctx => {
      window.webContents.reload()
      ctx.body = { success: true }
    })
  }
  new Koa()
    .use((ctx, next) => (ctx.set('Access-Control-Allow-Origin', '*'), next()))
    .use(koaBody({ urlencoded: false }))
    .use(router.routes())
    .on('error', console.error)
    .listen(46781, '127.0.0.1')
}

app
  .on('ready', create)
  .on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
  .on('activate', () => window == null && create())
