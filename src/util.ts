import fs from 'fs-extra'
import { remote } from 'electron'
import { join } from 'path'
import { platform } from 'os'

export function getMinecraftRoot () {
  const current = platform()
  return join(current === 'linux' ? remote.app.getPath('home') : remote.app.getPath('appData'),
    current === 'darwin' ? 'minecraft' : '.minecraft')
}
export const appDir = remote.app.getPath('userData')
export const skinsDir = join(appDir, 'skins')
fs.ensureDirSync(skinsDir, 1)
export const headsDir = join(appDir, 'heads')
fs.ensureDirSync(headsDir, 1)

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

export function cacheSkin (name: string) {
  return Promise.all([
    fetch(`https://minotar.net/helm/${name}/80.png`)
      .then(it => it.arrayBuffer())
      .then(it => fs.writeFile(join(headsDir, name + '.png'), it))
      .catch(console.error),
    fetch(`https://minotar.net/skin/${name}`)
      .then(it => it.arrayBuffer())
      .then(it => fs.writeFile(join(skinsDir, name + '.png'), it))
      .catch(console.error)
  ])
}
