import fs from 'fs-extra'
import uuid from 'uuid-by-string'
import * as resolveP from 'resolve-path'
import { Task } from '@xmcl/task'
import { version } from '../../package.json'
import { remote } from 'electron'
import { join, resolve, extname } from 'path'
import { createHash, BinaryLike } from 'crypto'
import { exec } from 'child_process'
import { Profile } from '../plugin/Authenticator'
import { Readable } from 'stream'
import { DEFAULT_EXT_FILTER, SKINS_PATH } from '../constants'

export function getJavaVersion (path: string) {
  const parseVersion = (str: string) => {
    const match = /(\d+\.\d+\.\d+)(_(\d+))?/.exec(str)
    if (match === null) return undefined
    return match[1]
  }
  return new Promise<string>(resolve => {
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
  .then(it => fs.writeFile(join(SKINS_PATH, p.key + '.png'), Buffer.from(it)))
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
export const getJson = <T = any> (url: string) => fetch(url, { cache: 'no-cache' }).then(r => r.json()) as Promise<T>
export const genUUIDOrigin = (t?: string) => uuid(t || (Math.random().toString() + Math.random().toString()))
export const genUUID = (t?: string) => genUUIDOrigin(t).replace(/-/g, '')
export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

export enum TaskStatus {
  PENDING = '',
  FINISHED = 'finished',
  ERROR = 'error',
  // PAUSED = 'paused',
  CANCELED = 'canceled'
}
export interface PureLauncherTask {
  key: number
  name: string
  progress: number
  status: TaskStatus
  isDownlaod: boolean
}
let taskId = 0
window.__updateTasksView = () => { }
const tasks = global.__tasks = []
export const addTask = <T> (task: Task<T>, name: string, isDownlaod = false) => {
  const t: PureLauncherTask = { name, isDownlaod, key: taskId++, progress: -1, status: TaskStatus.PENDING }
  let rootState: any
  return Task.execute(task)
    .once('execute', (state, parent) => {
      if (parent) return
      rootState = state
      tasks.push(t)
      __updateTasksView()
    })
    .on('update', (n, state) => {
      if (state !== rootState) return
      t.progress = n.progress
      __updateTasksView()
    })
    .once('finish', () => {
      t.status = TaskStatus.FINISHED
      __updateTasksView()
    })
    .once('fail', () => {
      t.status = TaskStatus.ERROR
      __updateTasksView()
    })
    .on('cancel', () => {
      t.status = TaskStatus.CANCELED
      __updateTasksView()
    })
    // .on('pause', () => {
    //   t.status = TaskStatus.PAUSED
    // })
    // .on('resume', () => {
    //   t.status = TaskStatus.PENDING
    // })
  tasks.push(t)
}

export const makeTempDir = async () => {
  const p = join(remote.app.getPath('temp'), genId())
  await fs.mkdir(p)
  return p
}

export const sha1 = (file: string) => new Promise<string>((resolve, e) => {
  const s = createHash('sha1').setEncoding('hex')
  fs.createReadStream(file).on('error', e).pipe(s).on('error', e).on('finish', () => resolve(s.read()))
})

export const md5 = (d: BinaryLike) => createHash('md5').update(d).digest('hex')

export const replace = (text: string, obj: object) => text.replace(/(?<!\\){(.+?)}/g, (_: string, t: string) => obj[t])

export const validPath = (parent: string, path: string, filter = DEFAULT_EXT_FILTER) => {
  /* eslint-disable no-control-regex */
  if (/[<>:"|?*\x00-\x1F]/.test(name) || path.length > 255 || filter.includes(extname(name))) {
    throw new Error(`The file name (${name}) is illegal.`)
  }
  return resolveP(resolve(parent), path) as string
}

export const removeFormatCodes = (text: string) => text.replace(/([\u00A7§]|\\u00A7)[\da-fklmnor]?/g, '')

export const getVersionTypeText = () => $('§7Powered by §e§lPureLauncher §r§o({0})', version)

export const autoNotices = <T> (p: Promise<T>) => p.then(r => {
  notice({ content: $('Success!') })
  return r
}, e => {
  console.error(e)
  notice({ content: $('Failed!'), error: true })
}) as any as Promise<T>

export const checkUrl = (url: string) => fetch(url, { method: 'HEAD', cache: 'no-cache' })
  // eslint-disable-next-line no-throw-literal
  .then(it => { if (it.ok) return true; else throw null }).catch(() => false)

export const readBuffer = (stream: Readable) => new Promise<Buffer>((resolve, reject) => {
  const arr = []
  stream.on('data', d => arr.push(d)).on('end', () => resolve(Buffer.from(arr))).on('error', reject)
})
