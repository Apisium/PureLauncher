import { ipcRenderer } from 'electron'
import { protocol } from '../../packages/web-api'
import * as T from './types'
import install from './install'
import P from '../models/index'
import GameStore, { STATUS } from '../models/GameStore'

const InterruptedResources = 'interruptedResources'
const gameStore = P.getStore(GameStore)
const mappings = {
  async Install (r: T.ProtocolInstall, request?: boolean) {
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
        if (gameStore.status === STATUS.READY) {
          notice({ content: $('Plugins installed! Restarting...') })
          setTimeout(() => location.reload(), 5000)
        } else {
          openConfirmDialog({ text: $('Currently, the game is launching. Please restart the game manually later to install the plugin!') })
        }
        return
      }
    }
    await install(r.resource, request)
  },
  Launch (data: T.ProtocolLaunch) {
    gameStore.launch(typeof data.version === 'object' ? data.version.id : data.version)
  }
}

const rs = JSON.parse(localStorage.getItem(InterruptedResources) || '[]')
localStorage.removeItem(InterruptedResources)
if (rs.length) {
  pluginMaster.once('loaded', async () => {
    for (const r of rs) await mappings.Install(r, false)
  })
}

ipcRenderer.on('pure-launcher-protocol', (_, args: any) => {
  try {
    const data: T.Protocol = typeof args === 'string' ? JSON.parse(args) : args
    if (!data || typeof data !== 'object') return
    if (data.type in mappings) mappings[data.type](data)
  } catch (e) {
    console.error(e)
  }
})
const data: T.ProtocolInstall = { type: 'Install', resource: 'http://acode.apisium.cn/libraries/mod.json' }
;(window as any).h = () => protocol(data).then(console.log, console.error)
