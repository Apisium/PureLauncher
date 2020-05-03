import React, { useLayoutEffect, useRef } from 'react'
import E from 'electron'
import { useLocation } from 'react-router-dom'
import { queryStatus } from '@xmcl/client/index'

const style = {
  position: 'absolute' as 'absolute',
  left: 192,
  right: -10,
  bottom: 0,
  top: 0
}
const ServerHome: React.FC = () => {
  let src = useLocation().search.replace(/^\?/, '')
  if (!src) return null
  src = decodeURIComponent(src)
  const ref = useRef<E.WebviewTag>()
  const w = ref.current
  useLayoutEffect(() => {
    const elm = document.getElementById('custom-server-home') as any as E.WebviewTag
    const cb = () => {
      elm.insertCSS(`
      ::-webkit-scrollbar {
        width: 7px;
        height: 7px;
      }

      ::-webkit-scrollbar-thumb {
        border-radius: 10px;
        background: rgba(0, 0, 0, .8);
        box-shadow: 0 3px 3px -2px rgba(0, 0, 0, .2),
          0 3px 4px 0 rgba(0, 0, 0, .14),
          0 1px 8px 0 rgba(0, 0, 0, .12);
      }

      ::-webkit-scrollbar-thumb:hover {
        box-shadow: 0 4px 5px -2px rgba(0, 0, 0, 0.2),
        0 7px 10px 1px rgba(0, 0, 0, 0.14),
        0 2px 16px 1px rgba(0, 0, 0, 0.12);
      }`)
    }
    elm.addEventListener('dom-ready', cb)
    const ipcEvent = (e: E.IpcMessageEvent) => {
      switch (e.channel) {
        case 'get-account': {
          const p = profilesStore.getCurrentProfile()
          elm.send('account', p.uuid, p.username, p.skinUrl, p.type)
          break
        }
        case 'query-minecraft-server':
          queryStatus.apply(null, e.args[1])
            .then(info => elm.send('minecraft-server-data', e.args[0], null, info))
            .catch(e => elm.send('minecraft-server-data', e.args[0], e?.message || ''))
      }
    }
    elm.addEventListener('ipc-message', ipcEvent)
    let fn: () => any
    if (process.env.DEV_SERVER_HOME) elm.addEventListener('dom-ready', (fn = () => elm.openDevTools()))
    return () => {
      elm.removeEventListener('dom-ready', cb)
      elm.removeEventListener('dom-ready', fn)
      elm.removeEventListener('ipc-message', ipcEvent)
    }
  }, [w])
  return React.createElement('webview', {
    src,
    ref,
    style,
    id: 'custom-server-home',
    enableremotemodule: 'false',
    preload: './serverHomePreload.js'
  })
}

export default ServerHome
