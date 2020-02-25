import React, { useLayoutEffect, useRef } from 'react'
import E from 'electron'
import { useLocation } from 'react-router-dom'

const css = {
  position: 'absolute' as 'absolute',
  left: 192,
  right: 0,
  bottom: 0,
  top: 0
}
const ServerHome: React.FC = () => {
  const url = useLocation().search.replace(/^\?/, '')
  if (!url) return null
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
    return () => elm.removeEventListener('dom-ready', cb)
  }, [w])
  return <webview src={url} style={css} ref={ref} id='custom-server-home' />
}

export default ServerHome
