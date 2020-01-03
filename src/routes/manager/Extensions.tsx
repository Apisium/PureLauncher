import './list.less'
import React, { useState } from 'react'
import { EXTENSION_BUTTONS } from '../../plugin/Plugin'
import IconButton from '../../components/IconButton'

const Extensions: React.FC = () => {
  (window as any).__extensionsUpdater = useState(false)
  const arr = new Array(pluginMaster[EXTENSION_BUTTONS].size)
  let i = 0
  pluginMaster[EXTENSION_BUTTONS].forEach(it => (arr[i++] =
    <IconButton key={it.key} title={it.title()} icon={it.icon} onClick={it.onClick} />))
  return <div className='manager-list version-switch manager-versions manager-extensions'>
    <div className='list-top'>
      <span className='header'>{$('Extensions')}</span>
    </div>
    <div className='container'>
      <div className='scroll-bar'>
        <div>{arr}</div>
      </div>
    </div>
  </div>
}

export default Extensions
