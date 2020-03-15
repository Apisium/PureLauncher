#!/usr/bin/env node

require('v8-compile-cache')
const Bundler = require('parcel')
const c = require('chalk')
const asar = require('asar')
const api = require('../web-api')
const parseArgs = require('minimist')
const os = require('os')
const fs = require('fs-extra')
const replacer = require('../parcel-plugin-replacer')
const { createHash } = require('crypto')
const { resolve, join, dirname } = require('path')

const argv = parseArgs(process.argv.slice(2), {
  alias: { e: 'entry', d: 'dist', p: 'port', f: 'file' },
  default: { replacer: true, remove: true }
})

const ENTRY = argv.entry || './src/index.ts'
const DIST = resolve(argv.dist || 'dist')
const DEV_PLUGIN = join(DIST, 'index.js')

const MESSAGES = {
  NOT_DEV: '❌  ' + c.redBright('PureLauncher is not currently in DEV mode. Please set environment variable ' +
    c.bgGreenBright.black(' DEV=true ')),
  NOT_RUNNING: '❌  ' + c.redBright('PureLauncher has not been ran yet. Please set environment variable ' +
    c.bgGreenBright.black(' DEV=true ') + ' Then run PureLauncher.'),
  UNKNOWN_COMMAND: '❌  ' + c.redBright('Unknown command, please ' +
    c.bgGreenBright.black(' https://github.com/Apisium/PureLauncher/wiki/Tools_Plugin_Development ') +
    ' To get more information.'),
  REMOVED: '🍀  ' + c.greenBright('Removed files:'),
  PACKING: '📦  ' + c.blueBright('Packing...'),
  PACKED: '📦  ' + c.greenBright('Packed successfully:'),
  WITHOUT_PACKAGE: '⚠️  ' + c.yellowBright('The ' + c.bgGreenBright.black(' package.json ') +
    ' is not found or missing the ' + c.bgGreenBright.black(' name ') + ' and ' +
    c.bgGreenBright.black(' version ') + ' fields.')
}

let BUILD = false
switch (argv._[0]) {
  case 'build':
    BUILD = true
    process.env.NODE_ENV = 'production'
    break
  case '':
  case null:
  case undefined:
    process.env.NODE_ENV = 'development'
    break
  default:
    console.error(MESSAGES.UNKNOWN_COMMAND)
    process.exit(-1)
}

(async () => {
  if (BUILD) {
    if (argv.remove) {
      await fs.remove(DIST)
      console.info(MESSAGES.REMOVED, DIST)
    }
  } else {
    if (argv.port) api.setPort(parseInt(argv.port, 10))
    try {
      if (!(await api.info()).isDev) {
        console.error(MESSAGES.NOT_DEV)
        process.exit(-1)
      }
    } catch (e) {
      console.error(e)
      console.error(MESSAGES.NOT_RUNNING)
      process.exit(-1)
    }
  }
  const bundler = new Bundler(ENTRY, {
    watch: !BUILD,
    production: BUILD,
    outDir: './dist',
    outFile: 'index.js',
    publicUrl: '.',
    target: 'electron',
    sourceMaps: false,
    bundleNodeModules: true
  })
  if (argv.replacer) replacer(bundler)
  if (!BUILD) {
    bundler.on('bundled', async () => {
      try {
        const info = await api.info()
        if (!info.isDev) {
          console.error(MESSAGES.NOT_DEV)
          process.exit(-1)
        }
        if (info.devPlugin !== DEV_PLUGIN) await api.post('setDevPlugin', { path: DEV_PLUGIN })
        await api.reload()
      } catch (e) {
        console.error(e)
        console.error(MESSAGES.NOT_RUNNING)
        process.exit(-1)
      }
    })
  }
  await bundler.bundle()
  if (BUILD) {
    console.info(MESSAGES.PACKING)
    const pkg = await fs.readJson('./package.json', { throws: false }) || { }
    pkg.main = 'index.js'
    if (!pkg.name || !pkg.version) console.warn(MESSAGES.WITHOUT_PACKAGE)
    await fs.writeJson(join(DIST, 'package.json'), pkg)
    const temp = join(os.tmpdir(), Date.now().toString(36) + Math.random().toString(36))
    await asar.createPackage(DIST, temp)
    let file = argv.file
    if (!file) {
      file = 'build/' + (await new Promise((resolve, e) => {
        const s = createHash('sha1').setEncoding('hex')
        fs.createReadStream(temp).on('error', e).pipe(s).on('error', e).on('finish', () => resolve(s.read()))
      })) + '.asar'
    }
    if (await fs.pathExists(file)) await fs.unlink(file)
    await fs.ensureDir(dirname(file))
    await fs.move(temp, file)
    console.log(MESSAGES.PACKED, file)
  }
})().catch(e => {
  console.error(e)
  process.exit(-1)
})
