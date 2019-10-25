const { basename } = require('path')
const { app, BrowserWindow, ipcMain, webContents } = require('electron')

let window = null
let downloadWindow = null

const sendToAll = (...args) => webContents.getAllWebContents().forEach(it => it.send(...args))

const create = () => {
  downloadWindow = new BrowserWindow({ width: 1, height: 1, show: false })
  const ctx = downloadWindow.webContents
  const downloadItems = { }
  let downloadViewer
  ipcMain
    .on('download-window-loaded', (e, id) => {
      downloadViewer = webContents.fromId(id).once('did-navigate', () => (downloadViewer = null))
      if (process.env.DOWNLOAD_DEV) downloadViewer.openDevTools()
    })
    .on('download', (e, id, item, name) => {
      if (!id || !item) throw new Error('Url is not exists.')
      const obj = downloadItems[id] = { item, name }
      try {
        if (Array.isArray(item)) {
          const urls = item.map((it, cid) => {
            const u = new URL(item.url)
            u.hash = id + '|' + cid
            return u.href
          }).values()
          obj.multiple = true
          obj.alive = 0
          obj.finished = 0
          obj.stopped = false
          const next = obj.next = () => {
            const g = urls.next()
            if (!g.done) {
              ctx.downloadUrl(g.value)
              obj.alive++
            }
          }
          if (downloadViewer)
            downloadViewer.send('start-download', id, item.slice(3).map(it => basename(it)).join(', '), name)
          for (let j = 0; i < 5; i++) next()
        } else {
          const u = new URL(item.url)
          u.hash = id
          ctx.downloadURL(u.href)
          if (downloadViewer) downloadViewer.send('start-download', id, basename(item.url), name)
        }
      } catch (e) {
        console.log(e)
      }
    })
  const items = new Set()
  let bytes = 0
  ctx.session.on('will-download', (e, i) => {
    const [id, cid] = new URL(i.getURL()).hash.slice(1).split('|', 2)
    const obj = downloadItems[id]
    i.setSavePath(cid ? obj.item[parseInt(cid, 10)].file : obj.item.file)
    i
      .on('updated', (_, state) => {
        if (state === 'interrupted') {
          obj.stopped = true
          sendToAll('download-end', id, 2)
          items.delete(i)
          delete downloadItems[id]
        } else {
          if (!obj.multiple && downloadViewer)
            downloadViewer.send('progress', id, i.getReceivedBytes() / i.getTotalBytes() * 100 | 0)
        }
      })
      .once('done', (_, state) => {
        items.delete(i)
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
    webPreferences: { webviewTag: true, nodeIntegration: true, nodeIntegrationInWorker: true  }
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
  if (process.env.NODE_ENV !== 'production') window.webContents.openDevTools()
}

app
  .on('ready', create)
  .on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
  .on('activate', () => window == null && create())
