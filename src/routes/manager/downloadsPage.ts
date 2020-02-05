import './downloads.css'
import { ipcRenderer, remote } from 'electron'

const list = document.getElementById('list')

const downloadItems: { [id: string]: HTMLLIElement } = { }
const downloadProgs: { [id: string]: HTMLProgressElement } = { }
const downloadButtons: { [id: string]: HTMLDivElement } = { }
let finished: string[] = []

const addItem = (_: any, id: string, file: string, name?: string, finish = false) => {
  if (id in downloadItems) return
  const li = downloadItems[id] = document.createElement('li')
  const div = document.createElement('div')
  div.className = 't'
  if (name) {
    const span = document.createElement('span')
    span.innerText = file
    div.innerText = name
    li.append(div, span)
  } else {
    div.innerText = file
    li.append(div)
  }
  if (finish) {
    li.className = 'finished'
    list.insertBefore(li, list.firstChild)
    finished.push(id)
    setTimeout(() => (li.style.transform = 'none'), 100)
    return
  }
  const p = downloadProgs[id] = document.createElement('progress')
  p.setAttribute('value', '-1')
  p.setAttribute('max', '100')
  const div2 = downloadButtons[id] = document.createElement('div')
  const btn = document.createElement('button')
  div2.className = 'b'
  btn.className = 'btn2 danger'
  btn.innerText = (window as any).__cancelText
  btn.onclick = () => ipcRenderer.send('download-cancel', id)
  div2.append(btn)
  li.append(div2, p)
  list.insertBefore(li, list.firstChild)
  setTimeout(() => (li.style.transform = 'none'), 100)
}
ipcRenderer
  .on('start-download', addItem)
  .on('progress', (_, id, p) => {
    const prog = downloadProgs[id]
    if (prog) prog.setAttribute('value', p)
  })
  .on('download-end', (_, id, type) => {
    const prog = downloadProgs[id]
    if (prog) {
      prog.remove()
      downloadButtons[id].remove()
      downloadItems[id].className = type === 0 ? 'finished' : type === 1 ? 'canceled' : 'error'
      delete downloadButtons[id]
      delete downloadProgs[id]
      finished.push(id)
    }
  })
  .on('download-items', (_, items) => items.forEach((it: any) => addItem(null, it.id, it.file, it.name, !!it.stopped)))
  .send('download-window-loaded', remote.getCurrentWebContents().id)

;(window as any).clearItems = () => {
  finished.forEach(it => {
    const e = downloadItems[it]
    if (e) {
      e.style.transform = ''
      setTimeout(() => e.remove(), 1050)
      delete downloadItems[it]
    }
  })
  finished = []
}
