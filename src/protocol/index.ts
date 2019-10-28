import { ipcRenderer } from 'electron'

ipcRenderer.on('pure-launcher-protocol', (_, args) => {
  console.log(args)
})
