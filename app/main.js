const r = require
const { join } = r('path')

const dir = r('electron').app.getPath('userData')
try {
  const json = r(join(dir, 'updates/entry-point.json'))
  if (json.version === r('./package.json').version) throw new Error()
  r(join(dir, 'updates/asar', json.file))
} catch (e) { r('./dist/src/main') }
