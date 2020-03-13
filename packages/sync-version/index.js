const { join } = require('path')
const { writeFileSync: w } = require('fs')

const appPackage = join(__dirname, '../../app/package.json')
const { version } = require('../../package.json')
if (require(appPackage).version !== version) {
  w(appPackage, `{"name":"pure-launcher","main":"main.js","private":true,"version":"${version}","author":"Shirasawa"}`)
}
