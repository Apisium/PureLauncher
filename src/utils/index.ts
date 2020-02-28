import fs from 'fs-extra'
import uuid from 'uuid-by-string'
import * as resolveP from 'resolve-path'
import { Task } from '@xmcl/task'
import { version } from '../../package.json'
import { remote } from 'electron'
import { join, resolve, extname, basename } from 'path'
import { createHash, BinaryLike } from 'crypto'
import { exec } from 'child_process'
import { Profile } from '../plugin/Authenticator'
import { Readable } from 'stream'
import { DEFAULT_EXT_FILTER, SKINS_PATH } from '../constants'
import { DownloadToOption } from '@xmcl/installer/index'
import { downloader } from '../plugin/DownloadProviders'

export function getJavaVersion (path: string) {
  const parseVersion = (str: string) => {
    const match = /(\d+\.\d+\.\d+)(_(\d+))?/.exec(str)
    if (match === null) return undefined
    return match[1]
  }
  return new Promise<string>(resolve => {
    exec(`${path} -version`, (_, __, serr) => {
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

const NIL = () => { }
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
  subName?: string
  progress: number
  status: TaskStatus
  cancel (): void
}
let taskId = 0
window.__updateTasksView = () => { }
const tasks = global.__tasks = []
export const addTask = <T> (task: Task<T>, name: string, subName?: string) => {
  const t: PureLauncherTask = { name, subName, key: taskId++, progress: -1, status: TaskStatus.PENDING, cancel: NIL }
  let rootState: any
  const ret = Task.execute(task)
  return ret
    .once('execute', (state, parent) => {
      if (parent) return
      rootState = state
      t.cancel = () => ret.cancel()
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
}

export const createDownloadTask = (option: DownloadToOption | DownloadToOption[]) => Task.create('download', ctx => {
  if (Array.isArray(option)) {
    if (option.length > 1) {
      ctx.update(0, option.length)
      return Promise.all(option.map((it, i) => ctx.execute(Task.create(
        'download.' + i, () => downloader.downloadFile(it)), 1))) as any as void
    } else option = option[0]
  }
  if (!option) {
    ctx.update(1, 0)
    return
  }
  const fn = option.progress
  option.progress = (a, b, c, d) => {
    ctx.update(b / c, c, d)
    if (fn) return fn(a, b, c, d)
  }
  return downloader.downloadFile(option)
})

export const download = (option: DownloadToOption | DownloadToOption[], name = $('Download'), subName?: string) =>
  addTask(createDownloadTask(option), name, subName ||
  (Array.isArray(option) ? undefined : basename(option.destination)))

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
