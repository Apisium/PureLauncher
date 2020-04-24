import { downloader } from '../plugin/DownloadProviders'

require('@xmcl/installer/util').resolveDownloader = (opts: any, closure: any) =>
  closure(opts.downloader ? opts : { ...opts, downloader })

const fs = require('fs-extra')
const installer = require('@xmcl/installer/index')

installer.CurseforgeInstaller.DEFAULT_QUERY = (project: number, file: number) => fetch(
  `https://addons-ecs.forgesvc.net/api/v2/addon/${project}/file/${file}/download-url`
).then(it => it.json())

const { readJson } = fs
fs.readJson = (path: string, opts: any) => {
  const p = readJson(path, opts)
  return opts && opts.throws === false ? p.catch(() => {}) : p
}
