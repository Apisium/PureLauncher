const fs = require('fs-extra')
const installer = require('@xmcl/installer')

installer.CurseforgeInstaller.DEFAULT_QUERY = (project: number, file: number) => fetch(
  `https://addons-ecs.forgesvc.net/api/v2/addon/${project}/file/${file}/download-url`, { cache: 'no-cache' }
).then(it => it.json())

const { readJson } = fs
fs.readJson = (path: string, opts: any) => {
  const p = readJson(path, opts)
  return opts && opts.throws === false ? p.catch(() => {}) : p
}
