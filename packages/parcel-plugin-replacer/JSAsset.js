const ParcelJSAsset = require('parcel/lib/assets/JSAsset')

const map = {
  'process.env.NODE_ENV': process.env.NODE_ENV === 'production' ? `'${process.env.NODE_ENV}'` : '$&',
  'process.env.DEV': process.env.NODE_ENV !== 'production'
}
const keys = []
const values = []
try {
  const json = JSON.parse(require('fs').readFileSync('./package.json').toString())
  if (typeof json === 'object' && typeof json.replacer === 'object') Object.assign(map, json.replacer)
} catch (e) { }
Object.entries(map).forEach(([key, value]) => {
  keys.push(new RegExp(key.startsWith('@') ? key.slice(1) : key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))
  values.push(value.toString())
})
module.exports = class JSAsset extends ParcelJSAsset {
  parse (code) {
    code = keys.reduce((p, key, i) => p.replace(key, values[i]), code)
    return super.parse(code).catch(e => {
      console.log(code)
      throw e
    })
  }
}
