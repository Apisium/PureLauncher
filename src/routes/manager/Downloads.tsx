import './list.less'
import E from 'electron'
import { currentName } from '../../i18n'
import React, { useRef, useEffect, useCallback } from 'react'

const dev = !!process.env.HMR_PORT
const Downloads: React.FC = () => {
  const ref = useRef<E.WebviewTag>()
  const w = ref.current
  const cb = useCallback(() => {
    w.insertCSS(`
      body {
        --finished: '${$('FINISHED')}';
        --error: '${$('ERROR')}';
        --canceled: '${$('CANCELED')}';
      }
    `)
    w.executeJavaScript(`window.__cancelText = '${$('CANCEL')}'`)
  }, [w])
  useEffect(() => {
    if (!w) return
    w.addEventListener('dom-ready', cb)
    return () => w.removeEventListener('dom-ready', cb)
  }, [w])
  return <div className='manager-list version-switch manager-versions manager-downloads'>
    <div className='list-top'>
      <span className='header'>{$('Downloads')}</span>
      <a className='add-btn' onClick={() => ref.current && ref.current
          .executeJavaScript('clearItems()').then(() => notice({ content: $('Success!') }))}>
        <i data-sound className='iconfont icon-shanchu_o' />
        <span data-sound>{$('Clear')}</span>
      </a>
    </div>
    <webview ref={ref} key={currentName} src='downloads.html' nodeintegration={dev.toString() as any} />
  </div>
}

export default Downloads
