import fetch from 'node-fetch'
import { version } from '../package.json'

console.log('Requesting...')
fetch('http://dl.pl.apisium.cn:5792/pull', {
  method: 'POST',
  body: JSON.stringify({ version, token: process.env.TOKEN })
}).then(it => it.json()).then(it => {
  if (!it.success || it.error) throw new Error(it.error || 'Request failed!')
}).catch(e => {
  console.error(e)
  process.exit(-1)
})
