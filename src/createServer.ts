import { BrowserWindow } from 'electron'
import { createServer } from 'http'
import { version } from '../package.json'

const PORT = (process.env.PORT && parseInt(process.env.PORT, 10)) || 46781

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Method': '*',
  'Access-Control-Allow-Headers': 'Content-Type'
}

const INFO = JSON.stringify({
  versions: { ...process.versions, pure_launcher: version },
  platform: process.platform,
  arch: process.arch
})
const ERROR = '{"error":true}'
const SUCCESS = '{"success":true}'

export default (window: BrowserWindow) => createServer((req, res) => (async () => {
  if (__DEV__) console.log(` \u001b[1;33m${req.method}: \u001b[37m${req.url}\u001b[0m`)
  let body: string
  switch (req.method) {
    case 'OPTION':
      body = SUCCESS
      break
    case 'GET':
      switch (req.url) {
        case '/info':
          body = INFO
          break
        case '/reload':
          if (__DEV__) {
            window.webContents.reload()
            body = SUCCESS
            break
          }
      }
      break
    case 'POST': {
      if (req.headers['content-type'] !== 'application/json') {
        body = '{"error":true,"message":"Headers is wrong!"}'
        break
      }
      const data = await new Promise<string>((resolve, reject) => {
        let str = ''
        req
          .setEncoding('utf8')
          .on('data', c => {
            if (str.length > 10240) {
              reject(new Error('The body of request is oversized!'))
              req.pause()
            } else str += c
          })
          .on('end', () => resolve(str))
          .on('error', reject)
      })
      switch (req.url) {
        case '/protocol':
          if (!window) {
            body = ERROR
            break
          }
          window.webContents.send('pure-launcher-protocol', data)
          body = SUCCESS
          break
      }
      break
    }
  }
  res.writeHead(body ? 200 : 404, HEADERS).end(body)
})().catch(e => {
  if (__DEV__) console.error(e)
  if (!res.finished) {
    if (!res.headersSent) res.writeHead(500, HEADERS)
    res.end(ERROR)
  }
})).on('error', e => __DEV__ && console.error(e)).listen(PORT)