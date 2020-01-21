const ParcelJSONAsset = require('parcel/lib/assets/JSONAsset')

global.JSONAsset = module.exports = class JSONAsset extends ParcelJSONAsset {
  generate () {
    if (!this.ast && this.contents.includes('pure-launcher')) {
      try {
        const json = JSON.parse(this.contents)
        if (json.name === 'pure-launcher' && json.author === 'Shirasawa') {
          return `exports.version='${json.version}'`
        }
      } catch (e) { console.error(e) }
    }
    const code = this.ast ? JSON.stringify(this.ast) : this.contents
    return `module.exports=JSON.parse(${JSON.stringify(code)})`
  }
}
