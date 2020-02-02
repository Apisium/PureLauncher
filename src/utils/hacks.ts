const fs = require('fs-extra')

const { readJson } = fs
fs.readJson = (path: string, opts: any) => {
  const p = readJson(path, opts)
  return opts && opts.throws === false ? p.catch(() => {}) : p
}
