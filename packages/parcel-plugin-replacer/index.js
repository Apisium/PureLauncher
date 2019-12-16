module.exports = b => {
  const path = require.resolve('./JSAsset')
  b.addAssetType('js', path)
  b.addAssetType('jsx', path)
  b.addAssetType('es6', path)
  b.addAssetType('mjs', path)
  b.addAssetType('jsm', path)
}
