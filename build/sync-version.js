const { join } = require('path')
const { writeFileSync: w } = require('fs')

const appPackage = join(__dirname, '../app/package.json')
const { version, description } = require('../package.json')
w(appPackage, `{
  "name": "pure-launcher",
  "main": "main.js",
  "private": true,
  "version": "${version}",
  "author": "Shirasawa",
  "description": "${description}"
}\n`)
