import { ipcRenderer } from 'electron'
import * as T from './types'
import Install from './install'
import P from '../models/index'
import GameStore from '../models/GameStore'

const gameStore = P.getStore(GameStore)
const mappings = {
  Install,
  Launch (data: T.ProtocolLaunch) {
    gameStore.launch(typeof data.version === 'object' ? data.version.id : data.version)
  }
}

ipcRenderer.on('pure-launcher-protocol', (_, args: string) => {
  try {
    const data: T.Protocol = typeof args === 'string' ? JSON.parse(args) : args
    if (!data || typeof args !== 'object') return
    if (data.type in mappings) mappings[data.type](data)
  } catch (e) {
    console.error(e)
  }
})
