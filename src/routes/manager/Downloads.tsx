import './list.less'
import E from 'electron'
import React, { useRef } from 'react'

const dev = process.env.NODE_ENV !== 'production'
const Downloads: React.FC = () => {
  const ref = useRef<E.WebviewTag>()
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
