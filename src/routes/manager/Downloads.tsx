import './list.less'
import E, { WebviewTag } from 'electron'
import { currentName } from '../../i18n'
import React, { useRef, useLayoutEffect } from 'react'

const dev = !!process.env.HMR_PORT
const Downloads: React.FC = () => {
  const ref = useRef<E.WebviewTag>()
  const w = ref.current
  useLayoutEffect(() => {
    const elm = document.getElementById('downloads-webview') as any as WebviewTag
    const cb = () => {
      elm.insertCSS(`
        body {
          --finished: '${$('FINISHED')}';
          --error: '${$('ERROR')}';
          --canceled: '${$('CANCELED')}';
        }
      `)
      elm.executeJavaScript(`window.__cancelText = '${$('CANCEL')}'`)
    }
    elm.addEventListener('dom-ready', cb)
    return () => w.removeEventListener('dom-ready', cb)
  }, [currentName])
  return <div className='manager-list version-switch manager-versions manager-downloads'>
    <div className='list-top'>
      <span className='header'>{$('Downloads')}</span>
      <a className='add-btn' onClick={() => ref.current && ref.current
        .executeJavaScript('clearItems()').then(() => notice({ content: $('Success!') }))}>
        <i data-sound className='iconfont icon-shanchu_o' />
        <span data-sound>{$('Clear')}</span>
      </a>
    </div>
    <webview
      id='downloads-webview'
      ref={ref}
      key={currentName}
      src='downloads.html'
      nodeintegration={dev.toString() as any}
    />
  </div>
}

export default Downloads
