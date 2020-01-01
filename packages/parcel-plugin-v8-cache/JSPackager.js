const fs = require('fs-extra')
const ParcelJSPackager = global.JSPackager || require('parcel/lib/packagers/JSPackager')
const { minify } = require('terser')
const { relative, join, dirname, basename } = require('path')

const EXCLUDES = ['downloadPage']

const OPTIONS = { compress: { ecma: 8 }, output: { beautify: false, comments: false, ecma: 8 } }
global.JSPackager = module.exports = class JSPackager extends ParcelJSPackager {
  constructor (a, b) {
    super(a, b)
    this.__size = 0
    this.__code = ''
    this.v8CacheFile = join(b.options.outDir, 'v8-cache.js')
  }
  async setup () {
    await super.setup()
    if (!await fs.pathExists(this.v8CacheFile)) {
      const data = await fs.readFile(require.resolve('v8-compile-cache'))
      await fs.writeFile(this.v8CacheFile, minify(data.toString(), OPTIONS).code)
    }
    let file = this.bundle.name
    if (EXCLUDES.every(it => !this.bundle.name.includes(it))) {
      file = file.replace(/js$/, 'c.js')
      const cFile = relative(dirname(this.bundle.name), this.v8CacheFile).replace(/\\/g, '/')
      this.dest.end(`require('./${cFile}');require('./${basename(file)}')`)
    } else this.dest.end('throw new Error("Compile error!")')
    this.dest = {
      write: (chunk = '') => void (this.__code += chunk),
      end: (chunk = '') => {
        this.__code += chunk
        if (this.__code.includes('Object.defineProperty')) {
          this.__code = '_ODP=Object.defineProperty,' + this.__code.replace(/Object\.defineProperty/g, '_ODP')
        }
        const { code } = minify(this.__code, OPTIONS)
        this.__size = code.length
        fs.writeFile(file, code)
      }
    }
  }
  getSize () { return this.__size }
}
