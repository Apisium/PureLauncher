const nbt = require('@xmcl/nbt')
const fs = require('fs')

nbt.deserialize(fs.readFileSync('D:\\A\\2\\.minecraft\\saves\\Skyblock 3.07\\level.dat'))
  .then(it => console.log(it.Data.LevelName))
