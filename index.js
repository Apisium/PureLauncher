const { app, BrowserWindow } = require('electron')

let window = null

const create = () => {
  window = new BrowserWindow({
    width: 816,
    height: 586,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    transparent: true,
    frame: false,
    webPreferences: { webviewTag: true, nodeIntegration: true }
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
