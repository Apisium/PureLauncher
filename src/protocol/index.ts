import { ipcRenderer, remote } from 'electron'
import { playNoticeSound } from '../utils/index'
import { protocol } from '../../packages/web-api'
import * as T from './types'
import install from './install'
import P from '../models/index'
import GameStore from '../models/GameStore'
import requestReload from '../utils/request-reload'

const gameStore = P.getStore(GameStore)
const currentWindow = remote.getCurrentWindow()

const mappings = {
  Install: (r: T.ProtocolInstall, request?: boolean) => install(r.resource, request, false),
  async Launch (data: T.ProtocolLaunch) {
    if (data.secret !== localStorage.getItem('analyticsToken') && !await openConfirmDialog({
      cancelButton: true,
      text: $('Received the request to launch the game. Do you want to launch the game') + ': ' +
        (data.version || profilesStore.selectedVersion.lastVersionId) + '?'
    })) return
    gameStore.launch(data.version)
  }
}

export default mappings

const INTERRUPTED_MESSAGE = 'interruptedMessage'
const handleMessage = async (data: T.Protocol) => {
  console.log(data)
  if (!data || typeof data !== 'object') return
  try {
    if (data.plugins) {
      const plugins = Object.keys(data.plugins).filter(it => !(it in pluginMaster.plugins))
      if (plugins.length) {
        let needReload = false
        let safePluginHashes: string[]
        for (const key of plugins) {
          const p = data.plugins[key]
          const obj: T.InstallView = { safePluginHashes }
          await install(p, false, true, T.isPlugin, obj)
          if (obj.noDependency) needReload = true
          safePluginHashes = obj.safePluginHashes
        }
        if (needReload) {
          const rs = JSON.parse(localStorage.getItem(INTERRUPTED_MESSAGE) || '[]')
          rs.push(data)
          localStorage.set(INTERRUPTED_MESSAGE, JSON.stringify(rs))
          requestReload()
          return
        }
      }
    }
    if (data.type in mappings) {
      mappings[data.type](data)
      playNoticeSound()
      currentWindow.flashFrame(true)
      currentWindow.restore()
      currentWindow.setAlwaysOnTop(true)
      currentWindow.setAlwaysOnTop(false)
    }
  } catch (e) {
    console.error(e)
  }
}
ipcRenderer.on('pure-launcher-protocol', (_, args: any, argv: any) => {
  const t = typeof args
  if (t === 'string') {
    if (args.startsWith('{') && args.endsWith('}')) handleMessage(JSON.parse(args))
    else if (args.includes('://')) {
      if (args.startsWith('pure-launcher://')) args = args.replace(/^pure-launcher:\/+/, '')
      else pluginMaster.emit('customProtocol', args, argv)
    }
  } else if (t === 'object' && !Array.isArray(t)) handleMessage(args)
})

const rs = JSON.parse(localStorage.getItem(INTERRUPTED_MESSAGE) || '[]')
localStorage.removeItem(INTERRUPTED_MESSAGE)
if (rs.length) {
  pluginMaster.once('loaded', async () => {
    for (const r of rs) await handleMessage(r)
  })
}
const data: T.ProtocolInstall = { type: 'Install', resource: 'http://acode.apisium.cn/libraries/version.json' }
;(window as any).h = () => protocol(data).then(console.log, console.error)
