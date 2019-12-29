const fs = require('fs-extra')
const ParcelJSPackager = global.JSPackager || require('parcel/lib/packagers/JSPackager')
const { promisify } = require('util')
const { minify } = require('terser')
const { relative, join, dirname, basename } = require('path')

const EXCLUDES = ['downloadPage']

const OPTIONS = { compress: { ecma: 8 }, output: { beautify: false, comments: false, ecma: 8 } }
global.JSPackager = module.exports = class JSPackager extends ParcelJSPackager {
  constructor (a, b) {
    super(a, b)
    this.v8CacheFile = join(b.options.outDir, 'v8-cache.js')
  }
  async setup () {
    await super.setup()
    if (!await fs.pathExists(this.v8CacheFile)) {
      const data = await fs.readFile(require.resolve('v8-compile-cache'))
      await fs.writeFile(this.v8CacheFile, minify(data.toString(), OPTIONS).code)
    }
    if (EXCLUDES.every(it => !this.bundle.name.includes(it))) {
      const file = this.bundle.name.replace(/js$/, 'c.js')
      const cFile = relative(dirname(this.bundle.name), this.v8CacheFile).replace(/\\/g, '/')
      this.dest.end(`require('./${cFile}');require('./${basename(file)}')`)
      this.dest = fs.createWriteStream(file)
      this.dest.write = promisify(this.dest.write.bind(this.dest))
      this.dest.end = promisify(this.dest.end.bind(this.dest))
    }
  }
}
