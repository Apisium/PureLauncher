import { downloader } from '../plugin/DownloadProviders'

const { normailzeDownloader } = require('@xmcl/installer/util')
require('@xmcl/installer/util').normailzeDownloader = (a: any) => {
  if (!a.downloader) a.downloader = downloader
  normailzeDownloader(a)
}

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
