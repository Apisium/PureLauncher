try {
  require(`../${require('../update.json').filename}/.`)
} catch (e) {
  try {
    require('../app.asar/.')
  } catch (e1) {
    require('./dist/src/main.js')
  }
}
