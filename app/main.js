const { join } = require('path')

const dir = require('electron').getPath('userData')
const r = require
try {
  r(join(dir, 'updates', require(join(dir, 'entry-point.json')).filename))
} catch (e) {
  r('./dist/src/main')
}
