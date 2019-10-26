import './downloads.css'
import { ipcRenderer, remote } from 'electron'

const list = document.getElementById('list')

const downloadItems: { [id: string]: HTMLLIElement } = { }
const downloadProgs: { [id: string]: HTMLProgressElement } = { }

ipcRenderer
  .on('start-download', (_, id, file, name) => {
    if (id in downloadItems) return
    const p = downloadProgs[id] = document.createElement('progress')
    p.setAttribute('max', '100')
    const li = downloadItems[id] = document.createElement('li')
    const div = document.createElement('div')
    if (name) {
      const span = document.createElement('span')
      span.append(file)
      div.append(name)
      li.append(div, span)
    } else {
      div.append(file)
      li.append(div)
    }
    li.append(p)
    list.append(li)
    setTimeout(() => (li.style.transform = 'none'), 100)
  })
  .on('progress', (_, id, p) => {
    const prog = downloadItems[id]
    if (prog) prog.setAttribute('value', p)
  })
  .on('download-end', (_, id, type) => {
    const prog = downloadProgs[id]
    if (prog) {
      prog.remove()
      downloadItems[id].className = type === 0 ? 'finished' : type === 1 ? 'canceled' : 'error'
    }
  })
  .send('download-window-loaded', remote.getCurrentWebContents().id)

;(window as any).clearItems = () => Object.values(downloadItems)
  .forEach(it => {
    if (it.className) {
      it.style.transform = ''
      setTimeout(() => it.remove(), 1050)
    }
  })
