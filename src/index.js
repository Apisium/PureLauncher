const { app, BrowserWindow, ipcMain } = require('electron')

let window = null
let downloadWindow = null

const create = () => {
  downloadWindow = new BrowserWindow({ width: 1, height: 1, show: false })
  const ctx = downloadWindow.webContents
  ipcMain.on('download', (e, obj) => {
    if (!obj || !obj.url) throw new Error('Url is not exists.')
    if (typeof obj.url === 'string') {
      ctx.downloadURL(obj.url)
    }
  })
  ctx.session.on('will-download', (e, i) => {
    console.log(i.getURL())
    e.preventDefault()
  })
  window = new BrowserWindow({
    width: 816,
    height: 586,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    transparent: true,
    frame: false,
    webPreferences: { webviewTag: true, nodeIntegration: true, nodeIntegrationInWorker: true  }
  })

  window.loadFile('./dist/index.html')
  if (process.env.NODE_ENV !== 'production') {
    window.webContents.openDevTools()
    window.on('closed', () => (window = null))
  }
}

app
  .on('ready', create)
  .on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
  .on('activate', () => window == null && create())
