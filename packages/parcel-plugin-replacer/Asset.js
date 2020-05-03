const { builtinModules } = require('module')

// eslint-disable-next-line node/no-deprecated-api
const ms = builtinModules.filter(x => !/^_|^(internal|v8|node-inspect)\/|\//.test(x) && x !== 'sys')
ms.push('electron')
const noBuilds = new Set(ms)

const DEV = process.env.NODE_ENV !== 'production'
const map = {
  'process.env.NODE_ENV': process.env.NODE_ENV === 'production' ? '"production"' : '$&',
  '@(?<!(var|let|const)\\s+)__DEV__': DEV
}

if (!DEV) noBuilds.add('./cjs/react.development.js')

const keys = []
const values = []
try {
  const json = JSON.parse(require('fs').readFileSync('./package.json').toString())
  if (typeof json === 'object') {
    if (typeof json.replacer === 'object') Object.assign(map, json.replacer)
    if (Array.isArray(json.noBuilds)) json.forEach(it => noBuilds.add(it))
  }
} catch (e) { }
Object.entries(map).forEach(([key, value]) => {
  keys.push(new RegExp(key.startsWith('@') ? key.slice(1) : key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))
  values.push(value.toString())
})

const replace = code => keys.reduce((p, key, i) => p.replace(key, values[i]), code)
module.exports = A => class Asset extends A {
  generate () {
    this.contents = replace(this.contents)
    return super.generate()
  }
  parse (code) {
    if (code.includes('forge-site')) console.log(code)
    return super.parse(replace(code))
  }
  addDependency (name, opts) {
    if (!noBuilds.has(name)) super.addDependency(name, opts)
  }
  load () {
    return super.load().then(it => typeof it === 'string' ? replace(it) : it)
  }
}
