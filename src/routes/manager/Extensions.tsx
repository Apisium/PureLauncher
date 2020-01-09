import './list.less'
import React, { useState } from 'react'
import IconButton from '../../components/IconButton'

const Extensions: React.FC = () => {
  (window as any).__extensionsUpdater = useState(false)
  const arr = new Array(pluginMaster.extensionsButtons.size)
  let i = 0
  pluginMaster.extensionsButtons.forEach(it => (arr[i++] =
    <IconButton key={it.key} title={it.title()} icon={it.icon} onClick={it.onClick} hideFirst={it.hideFirst} />))
  return <div className='manager-list version-switch manager-versions manager-extensions'>
    <div className='list-top'>
      <span className='header no-button'>{$('Extensions')}</span>
    </div>
    <div className='container'>
      <div className='scroll-bar'>
        <div>{arr}</div>
      </div>
    </div>
  </div>
}

export default Extensions
