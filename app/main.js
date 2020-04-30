const r = require

if (global.__loadUpdatePack) {
  r('./dist/src/main')
  return
}

const { join } = r('path')

const dir = r('electron').app.getPath('userData')
try {
  const json = r(join(dir, 'updates/entry-point.json'))
  if (json.version === r('./package.json').version) {
    r('./dist/src/main')
    return
  }
  global.__loadUpdatePack = true
  r(join(dir, 'updates/asar', json.file))
} catch (e) { r('./dist/src/main') }
