const fs = require('fs-extra')
const ParcelJSPackager = global.JSPackager || require('parcel/lib/packagers/JSPackager')
const { minify } = require('terser')
const { relative, join, dirname } = require('path')

const EXCLUDES = ['downloadPage']

const OPTIONS = { compress: { ecma: 8 }, output: { beautify: false, comments: false, ecma: 8 } }
global.JSPackager = module.exports = class JSPackager extends ParcelJSPackager {
  constructor (a, b) {
    super(a, b)
    this.v8CacheFile = join(b.options.outDir, 'v8-cache.js')
  }
  async setup () {
    const data = await fs.readFile(require.resolve('v8-compile-cache'))
    await fs.writeFile(this.v8CacheFile, minify(data.toString(), OPTIONS).code)
    await super.setup()
  }
  async start () {
    if (EXCLUDES.every(it => !this.bundle.name.includes(it))) {
      const file = relative(dirname(this.bundle.name), this.v8CacheFile).replace(/\\/g, '/')
      await this.write(`typeof require!='undefined'&&require('./${file}');`)
    }
    await super.start()
  }
}
