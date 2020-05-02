const ParcelJSONAsset = require('parcel/lib/assets/JSONAsset')

global.JSONAsset = module.exports = class JSONAsset extends ParcelJSONAsset {
  generate () {
    if (!this.ast && this.contents.includes('pure-launcher')) {
      try {
        const json = JSON.parse(this.contents)
        if (json.author && json.name === 'pure-launcher' && json.author.name === 'Shirasawa') {
          return `exports.version='${json.version}'`
        }
      } catch (e) { console.error(e) }
    }
    let code
    if (this.ast) code = JSON.stringify(this.ast)
    else {
      try { code = JSON.stringify(JSON.parse(this.contents)) } catch (e) {
        console.error(e)
        code = this.contents
      }
    }
    return `module.exports=JSON.parse(${JSON.stringify(code)})`
  }
}
