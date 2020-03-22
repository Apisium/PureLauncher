module.exports = b => {
  const js = require.resolve('./JSAsset')
  const ts = require.resolve('./TypeScriptAsset')
  b.addAssetType('js', js)
  b.addAssetType('jsx', js)
  b.addAssetType('es6', js)
  b.addAssetType('mjs', js)
  b.addAssetType('jsm', js)
  b.addAssetType('ts', ts)
  b.addAssetType('tsx', ts)
  b.addAssetType('json', require.resolve('./JSONAsset'))
  b.addAssetType('unpack.js', require.resolve('parcel/lib/assets/RawAsset'))
}
