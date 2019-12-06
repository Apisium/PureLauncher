import fs from 'fs-extra'
import uuid from 'uuid-by-string'
import { remote, ipcRenderer } from 'electron'
import { join } from 'path'
import { platform } from 'os'
import { exec } from 'child_process'
import { Profile } from '../plugin/Authenticator'

export function getMinecraftRoot () {
  const current = platform()
  return join(current === 'linux' ? remote.app.getPath('home') : remote.app.getPath('appData'),
    current === 'darwin' ? 'minecraft' : '.minecraft')
}
export const appDir = remote.app.getPath('userData')
export const skinsDir = join(appDir, 'skins')
fs.ensureDirSync(skinsDir, 1)

export function getJavaVersion (path: string) {
  const parseVersion = (str: string) => {
    const match = /(\d+\.\d+\.\d+)(_(\d+))?/.exec(str)
    if (match === null) return undefined
    return match[1]
  }
  return new Promise<string>((resolve, reject) => {
    exec(`${path} -version`, (_, stdout, serr) => {
      if (!serr) {
        resolve(undefined)
      } else {
        const version = parseVersion(serr)
        if (version !== undefined) {
          resolve(version)
        } else {
          resolve(undefined)
        }
      }
    })
  })
}

export const cacheSkin = (p: Profile) => fetch(p.skinUrl)
  .then(it => it.arrayBuffer())
  .then(it => fs.writeFile(join(skinsDir, p.key + '.png'), Buffer.from(it)))
  .catch(console.error)

export const fetchJson = (url: string, post = false, body?: any, other?: RequestInit) => fetch(url, {
  ...other,
  method: post ? 'POST' : 'GET',
  body: JSON.stringify(body),
  headers: body
    ? other ? { ...other.headers, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' }
    : other.headers
}).then(it => it.json().catch(() => null))
export const getJson = (url: string) => fetch(url, { cache: 'no-cache' }).then(r => r.json())
export const genUUID = (t?: string) => uuid(t || Math.random().toString() + Math.random().toString())
  .replace(/-/g, '')
export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

interface DownloadItem {
  item: { url: string, file: string } | Array<{ url: string, file: string }>
  name?: string
  resolve: () => void
  reject: (e: number) => void
}
const downloadList: { [id: string]: DownloadItem } = { }
export const download = (item: DownloadItem['item'], name?: string) => {
  const id = genId()
  let resolve: () => void
  let reject: (e: number) => void
  const promise = new Promise<void>((res, rej) => {
    resolve = res
    reject = rej
  })
  downloadList[id] = { item, name, resolve, reject }
  ipcRenderer.send('download', id, item, name)
  return promise
}
ipcRenderer.on('download-end', (_, id, type) => {
  const obj = downloadList[id]
  if (!obj) return
  delete downloadList[id]
  if (type) obj.reject(type); else obj.resolve()
})
