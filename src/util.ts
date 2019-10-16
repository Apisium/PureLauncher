import fs from 'fs-extra'
import uuid from 'uuid-by-string'
import { remote } from 'electron'
import { join } from 'path'
import { platform } from 'os'
import { Profile } from './plugin/Authenticator'

export function getMinecraftRoot () {
  const current = platform()
  return join(current === 'linux' ? remote.app.getPath('home') : remote.app.getPath('appData'),
    current === 'darwin' ? 'minecraft' : '.minecraft')
}
export const appDir = remote.app.getPath('userData')
export const skinsDir = join(appDir, 'skins')
fs.ensureDirSync(skinsDir, 1)

import { exec } from 'child_process'

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
  headers: body ?
    other ? { ...other.headers, 'Content-Type': 'application/json' }
      : { 'Content-Type': 'application/json' }
    : other.headers
}).then(it => it.json().catch(() => null))
export const genUUID = (t?: string) => uuid(t || Math.random().toString(32) + Math.random().toString(32))
  .replace(/-/g, '')
