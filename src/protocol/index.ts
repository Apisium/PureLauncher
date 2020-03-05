import { ipcRenderer, remote } from 'electron'
import { protocol } from '../../packages/web-api'
import * as T from './types'
import install from './install'
import P from '../models/index'
import installLocal from './install-local'
import GameStore from '../models/GameStore'
import requestReload from '../utils/request-reload'

const gameStore = P.getStore(GameStore)
const currentWindow = remote.getCurrentWindow()

const InterruptedResources = 'interruptedResources'
const mappings = {
  async Install (r: T.ProtocolInstall, request?: boolean) {
    console.log(r)
    if (r.plugins) {
      const plugins = Object.keys(r.plugins).filter(it => !(it in pluginMaster.plugins))
      if (plugins.length) {
        if (r.notInstallPlugins) return
        if (!await install(r.resource, true, false, null, null, true)) return
        for (const key of plugins) {
          const p = r.plugins[key]
          await install(p, false, true, T.isPlugin)
        }
        const rs = JSON.parse(localStorage.getItem(InterruptedResources) || '[]')
        rs.push(r)
        localStorage.set(InterruptedResources, JSON.stringify(rs))
        requestReload()
        return
      }
    }
    await install(r.resource, request, false)
  },
  async Launch (data: T.ProtocolLaunch) {
    if (data.secret !== localStorage.getItem('analyticsToken') && !await openConfirmDialog({
      cancelButton: true,
      text: $('Received the request to launch the game. Do you want to launch the game') + ': ' +
        (data.version || profilesStore.selectedVersion.lastVersionId) + '?'
    })) return
    gameStore.launch(data.version)
  },
  InstallLocal (data: T.ProtocolInstallLocal) {
    installLocal(data.path)
  }
}

const rs = JSON.parse(localStorage.getItem(InterruptedResources) || '[]')
localStorage.removeItem(InterruptedResources)
if (rs.length) {
  pluginMaster.once('loaded', async () => {
    for (const r of rs) await mappings.Install(r, false)
  })
}

ipcRenderer.on('pure-launcher-protocol', (_, args: any, argv: any) => {
  try {
    const str = typeof args === 'string'
    if (str) {
      if (args.includes('://')) {
        if (args.startsWith('pure-launcher://')) args = args.replace(/^pure-launcher:\/+/, '')
        else {
          pluginMaster.emit('customProtocol', args, argv)
          return
        }
      }
      if (!args.startsWith('{') || !args.endsWith('}')) return
    }
    const data: T.Protocol = str ? JSON.parse(args) : args
    if (!data || typeof data !== 'object') return
    if (data.type in mappings) {
      mappings[data.type](data)
      currentWindow.flashFrame(true)
    }
  } catch (e) {
    console.error(e)
  }
})
const data: T.ProtocolInstall = { type: 'Install', resource: 'http://acode.apisium.cn/libraries/version.json' }
;(window as any).h = () => protocol(data).then(console.log, console.error)
