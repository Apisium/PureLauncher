import './downloads.css'
import { ipcRenderer, remote } from 'electron'

const list = document.getElementById('list')

const downloadItems: { [id: string]: HTMLProgressElement } = { }

ipcRenderer
  .on('start-download', (_, id, file, name) => {
    const p = downloadItems[id] = document.createElement('progress')
    p.setAttribute('max', '100')
    const li = document.createElement('li')
    if (name) {
      const span = document.createElement('span')
      span.append(file)
      li.append(name, span)
    } else li.append(file)
    li.append(p)
    list.append(li)
  })
  .on('progress', (_, id, p) => {
    const prog = downloadItems[id]
    if (prog) prog.setAttribute('value', p)
  })
  .on('download-end', (_, id, type) => {
    const prog = downloadItems[id]
    if (prog) prog.remove()
  })
  .send('download-window-loaded', remote.getCurrentWebContents().id)

;(window as any).clearItems = () => {
  console.log(2333) // TODO:
}
