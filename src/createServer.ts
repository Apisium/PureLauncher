import isDev from './utils/isDev'
import { BrowserWindow, ipcMain } from 'electron'
import { createServer } from 'http'
import { version } from '../package.json'

const PORT = (process.env.PORT && parseInt(process.env.PORT, 10)) || 46781

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Method': '*',
  'Access-Control-Allow-Headers': 'Content-Type'
}

const ERROR = '{"error":true}'
const SUCCESS = '{"success":true}'

ipcMain.on('dev-reset-devPlugin', () => (process.env.DEV_PLUGIN = ''))

const create = (window: BrowserWindow) => createServer((req, res) => (async () => {
  if (__DEV__) console.log(` \u001b[1;33m${req.method}: \u001b[37m${req.url}\u001b[0m`)
  let body: string
  switch (req.method) {
    case 'OPTIONS':
      body = SUCCESS
      break
    case 'GET':
      switch (req.url) {
        case '/info':
          /* eslint-disable @typescript-eslint/camelcase */
          body = JSON.stringify({
            isDev,
            devPlugin: process.env.DEV_PLUGIN,
            versions: { ...process.versions, pure_launcher: version },
            platform: process.platform,
            arch: process.arch
          })
          break
        case '/reload':
          if (isDev) {
            window.webContents.reload()
            body = SUCCESS
          }
          break
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
        case '/close':
          body = SUCCESS
          console.log(req.headers.referer)
          break
        case '/protocol':
          window.webContents.send('pure-launcher-protocol', data)
          body = SUCCESS
          break
        case '/setDevPlugin':
          if (isDev) {
            try {
              const json = JSON.parse(data)
              process.env.DEV_PLUGIN = json.path
              body = SUCCESS
            } catch (e) {
              console.error(e)
              body = ERROR
            }
          }
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
})).on('error', (e: any) => {
  console.error(e)
  if (e.code === 'EADDRINUSE') {
    // TODO
  }
}).listen(PORT)

export default create
