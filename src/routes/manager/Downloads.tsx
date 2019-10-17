import './list.less'
import React, { useEffect as ue, useRef } from 'react'

const dev = process.env.NODE_ENV !== 'production'
const Downloads: React.FC = () => {
  const ref = useRef<any>()
  if (dev) {
    ue(() => {
      const webview = ref.current
      if (!webview) return
      webview.addEventListener('dom-ready', () => {
        webview.openDevTools()
      })
    })
  }
  return <div className='manager-list version-switch manager-versions manager-downloads'>
    <div className='list-top'>
      <span className='header'>{$('Downloads')}</span>
      <a className='add-btn' onClick={() => ref.current && ref.current
          .executeJavaScript('clearItems()').then(() => notice({ content: $('Success!') }))}>
        <i data-sound className='iconfont icon-shanchu_o' />
        <span data-sound>{$('Clear')}</span>
      </a>
    </div>
    <webview ref={ref} src='downloads.html' nodeintegration={dev.toString() as any} />
  </div>
}

export default Downloads
