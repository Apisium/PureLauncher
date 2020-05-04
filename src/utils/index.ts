import * as resolveP from 'resolve-path'
import fs, { pathExists } from 'fs-extra'
import Unzip from '@xmcl/unzip/index'
import which from 'which'
import arch from 'arch'
import history from './history'
import debounce from 'lodash/debounce'
import locateJava from 'locate-java-home/js/es5/index'
import { freemem, totalmem } from 'os'
import { Task } from '@xmcl/task/index'
import { promisify } from 'util'
import { ZipFile } from 'yazl'
import { version } from '../../package.json'
import { join, resolve, extname, basename } from 'path'
import { createHash, BinaryLike } from 'crypto'
import { exec, spawn, execFile } from 'child_process'
import { Profile } from '../plugin/Authenticator'
import { Readable } from 'stream'
import { extractTaskFunction } from '@xmcl/unzip/task/index'
import { ILocateJavaHomeOptions, IJavaHomeInfo } from 'locate-java-home/js/es5/lib/interfaces'
import { DEFAULT_EXT_FILTER, SKINS_PATH, TEMP_PATH, LAUNCHER_MANIFEST_URL,
  DEFAULT_LOCATE, APP_PATH, GAME_ROOT, UNPACKED_PATH, IS_WINDOWS } from '../constants'
import { DownloadOption } from '@xmcl/installer/index'
import { downloader } from '../plugin/DownloadProviders'
import { genUUIDOrigin } from './analytics'

export { genUUIDOrigin }

export const getJavaVersion = (path: string, file = false) => new Promise<[string, boolean] | undefined>(resolve => {
  const cb = (_, sout, serr) => {
    const output = '' + sout + serr
    console.log()
    if (output) {
      const version = /\d+\.\d+\.\d+/.exec(output)
      if (version) {
        resolve([version[0], output.includes('64-Bit')])
        return
      }
    }
    resolve()
  }
  if (file) execFile(path, ['-version'], cb)
  else exec(`${path} -version`, cb)
})

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
      t.progress = n.total == null ? -1 : (n.progress / n.total * 100) | 0
      __updateTasksView()
    })
    .on('finish', (_, state) => {
      if (state !== rootState) return
      t.status = TaskStatus.FINISHED
      __updateTasksView()
    })
    .on('fail', (_, state) => {
      if (state !== rootState) return
      t.status = TaskStatus.ERROR
      __updateTasksView()
    })
    .on('cancel', (state) => {
      if (state !== rootState) return
      t.status = TaskStatus.CANCELED
      __updateTasksView()
    })
}

export const createUnzipTask = (openFile: Unzip.OpenTarget, dest: string, options?: Unzip.ExtractOptions) =>
  Task.create('unzip', extractTaskFunction(openFile, dest, options))

export const unzip = (
  openFile: Unzip.OpenTarget,
  dest: string,
  options?: Unzip.ExtractOptions & { name?: string, subName?: string }
) => {
  const {
    name = $('Extracting'),
    subName = typeof openFile === 'string' ? basename(openFile) : undefined,
    ...opts
  } = options || { }
  return addTask(createUnzipTask(openFile, dest, opts), name, subName).wait()
}

export const createDownloadTask = (option: DownloadOption | DownloadOption[]) => Task.create('download', ctx => {
  if (Array.isArray(option)) {
    if (option.length > 1) {
      ctx.update(0, option.length)
      return Promise.all(option.map((it, i) => ctx.execute(Task.create(
        'download.' + i, () => downloader.downloadFile(it)), 1))) as any as void
    } else option = option[0]
  }
  if (!option) {
    ctx.update(0, 0)
    return
  }
  const fn = option.progress
  option.progress = (a, b, c, d) => {
    ctx.update(b, c, d)
    if (fn) return fn(a, b, c, d)
  }
  return downloader.downloadFile(option)
})

export const download = (option: DownloadOption | DownloadOption[], name = $('Download'), subName?: string) =>
  addTask(createDownloadTask(option), name, subName ||
  (Array.isArray(option) || !option.destination ? undefined : basename(option.destination))).wait()

export const makeTempDir = async () => {
  const p = join(TEMP_PATH, genId())
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

export const getVersionTypeText = () => $('§7Powered by §e§lPureLauncher §r§o({0})§r', version)

export const autoNotices = <T extends boolean | Promise<any>> (p: T): T extends Promise<any> ? T : void =>
  typeof p === 'boolean' ? notice({ content: $(p ? 'Success!' : 'Failed!'), error: p }) : (p as any).then(r => {
    notice({ content: $('Success!') })
    return r
  }, e => {
    console.error(e)
    notice({ content: $('Failed!'), error: true })
  }) as any

export const readBuffer = (stream: Readable) => new Promise<Buffer>((resolve, reject) => {
  const arr = []
  stream.on('data', d => arr.push(d)).on('end', () => resolve(Buffer.from(arr))).on('error', reject)
})

let _isX64 = null
export const isX64 = (): boolean => _isX64 === null ? (_isX64 = arch() === 'x64') : _isX64
const getSelfInstalledJavaPath = () => join(APP_PATH, 'java', isX64() ? 'x64' : 'x86')

export const installJava = () => {
  const destination = join(TEMP_PATH, genId())
  const dir = getSelfInstalledJavaPath()
  const x64 = isX64()
  return getJson(LAUNCHER_MANIFEST_URL)
    .then(it => {
      const java = it.java.windows[x64 ? 'x64' : 'x86']
      return download({
        destination,
        url: java.urls[+(DEFAULT_LOCATE !== 'zh-cn')],
        checksum: { algorithm: 'sha1', hash: java.hash }
      }, 'Java', 'java1.8.0_51-win32-x64.zip')
    })
    .then(() => unzip(destination, dir))
    .then(() => {
      const file = join(dir, 'bin/javaw.exe')
      localStorage.setItem('javaPath', file)
      const arches = JSON.parse(localStorage.getItem('javaArches') || '{}')
      arches[file] = x64
      localStorage.setItem('javaArches', JSON.stringify(arches))
      return file
    })
    .finally(() => fs.unlink(destination).catch(() => {}))
}

export const getSuitableMemory = (isX64: boolean) => {
  let mem = freemem() / 1024 / 1024 | 0
  const total = totalmem() / 1024 / 1024 | 0
  if (isX64) {
    if (mem < 512) return 512
    if (mem < 1024) return mem
    if (mem > 4096) mem = mem > total - 2048 ? 1024 * 8 : total - 2048
    else return mem > total - 1024 ? 4096 : mem
    mem = Math.min(freemem() / 1024 / 1024 | 0, mem)
    return mem > 1024 * 8 ? 1024 * 8 : mem
  } else {
    if (mem > 2048) return 2048
    if (mem < 512) return 512
    return mem > total - 512 ? mem : total - 512
  }
}

export const vertifyJava = async (version: [string, boolean], dialog = false) => {
  if (parseInt(version[0].split('.')[1] || '7') < 8 && (!dialog || !await openConfirmDialog({
    ignore: true,
    cancelButton: true,
    text: $('The version of Java you selected is {0}, which may cause the game to fail to be launched. Java 8 (1.8.0) is recommended.', version[0])
  }))) return false
  const x64 = isX64()
  if ((version[1] && !x64) && (!dialog || !await openConfirmDialog({
    ignore: true,
    cancelButton: true,
    text: $('The Java you selected is 64-bit, but the system only supports 32-bit, which will cause the game to fail to be launched.')
  }))) return false
  if ((!version[1] && x64) && (!dialog || !await openConfirmDialog({
    ignore: true,
    cancelButton: true,
    text: $('The Java you selected is 32-bit, but the system supports 64-bit, which will not be able to take full advantage of computer performance.')
  }))) return false
  return true
}

const locateJavaAsync: (options: ILocateJavaHomeOptions) => Promise<IJavaHomeInfo[] | null> = promisify(locateJava)
export const findJavaPath = async () => {
  const ext = IS_WINDOWS ? '.exe' : ''
  const baseName = (process.platform === 'linux' ? 'java' : 'javaw') + ext
  const name = 'bin/' + baseName
  let path = join(getSelfInstalledJavaPath(), name)
  if (await pathExists(path)) return path
  const arch = isX64() ? '64' : '86'
  switch (process.platform) {
    case 'win32':
      path = join('C:\\Program Files (x86)\\Minecraft Launcher\\runtime\\jre-x' + arch, name)
      break
    case 'darwin':
      path = join(GAME_ROOT, 'runtime/jre-x' + arch, 'jre.bundle/Contents/Home', name)
      break
    default:
      break
  }
  if (await pathExists(path)) return path
  const version = await getJavaVersion(baseName)
  if (version && await vertifyJava(version)) {
    path = await which(baseName).catch(console.error)
    if (path) return path
  }
  const java = await locateJavaAsync({ version: '~1.8', mustBe64Bit: isX64(), paranoid: true }).catch(console.error)
  if (java && java.length) {
    path = join(java[0].path, name)
    if (await pathExists(path)) return path
  }
}

export const addDirectoryToZipFile = async (zip: ZipFile, realPath: string, path = basename(realPath)) => {
  await Promise.all((await fs.readdir(realPath)).map(async it => {
    const f = join(realPath, it)
    const p = path + '/' + it
    const stat = await fs.stat(f)
    if (stat.isFile()) zip.addFile(f, p)
    else if (stat.isDirectory()) await addDirectoryToZipFile(zip, f, p)
  }))
}

const clickSound = new Audio(require('../assets/sounds/levelup.ogg'))
export const playNoticeSound = () => void (clickSound.readyState === 4 && window.profilesStore?.extraJson?.soundOn &&
  clickSound.play().catch(() => {}))

export const openServerHome = (url: string) => {
  if (!url || typeof url !== 'string') return
  if (url.startsWith('/serverHome?')) history.push(url)
  else {
    try {
      // eslint-disable-next-line no-new
      new URL(url)
      if (!url.startsWith('https://') && !url.startsWith('http://')) return
      history.push('/customServerHome?' + encodeURIComponent(url))
    } catch { }
  }
}

export const reloadPage = () => {
  history.push('/loading')
  process.nextTick(() => history.goBack())
}

export const watchFile = (path: string, onChange: () => any, time = 5000) => {
  let f: fs.FSWatcher
  fs.pathExists(path).then(exists => !exists && fs.mkdir(path))
    .then(() => (f = fs.watch(path, debounce(onChange, time)).on('error', console.error)))
    .catch(console.error)
  return () => f?.close()
}

const CRIPT_FILE = join(UNPACKED_PATH, 'createShortcut.js')
export const createShortcut = (name: string, target: string, args = '', description = '', icon?: string) => {
  if (!IS_WINDOWS) return Promise.reject(new Error('It does not running in Windows!'))
  return new Promise((resolve, reject) => spawn('cscript', [CRIPT_FILE, name, target,
    args.replace(/"/g, '*?#!*'), description, icon || (process.execPath + ', 0')])
    .on('error', reject).on('close', resolve))
}
