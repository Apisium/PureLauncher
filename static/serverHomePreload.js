const { ipcRenderer } = require('electron')

const map = { }
ipcRenderer.on('minecraft-server-data', (_, id, err, info) => {
  const obj = map[id]
  if (!obj) return
  if (err) obj[1](new Error(err))
  else obj[0](info)
})
window.queryMinecraftServer = (...args) => {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
  const p = new Promise((resolve, reject) => (map[id] = [resolve, reject]))
  ipcRenderer.sendToHost('query-minecraft-server', id, args)
  return p
}

window.getAccount = () => {
  ipcRenderer.sendToHost('get-account')
  return new Promise(resolve => ipcRenderer.once('account', (e, uuid, name, skinUrl, type) =>
    resolve({ uuid, name, skinUrl, type })))
}
