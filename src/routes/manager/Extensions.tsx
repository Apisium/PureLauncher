import './list.less'
import React, { useState } from 'react'
import ToolTip from 'rc-tooltip'
import IconButton from '../../components/IconButton'

const css = { zIndex: 1100 }
const Extensions: React.FC = () => {
  (window as any).__extensionsUpdater = useState(false)
  const arr = new Array(pluginMaster.extensionsButtons.size)
  let i = 0
  pluginMaster.extensionsButtons.forEach(it => {
    const title = it.title()
    arr[i++] = <ToolTip placement='top' key={it.key} overlay={title} overlayStyle={css}>
      <IconButton title={title} icon={it.icon} onClick={it.onClick} hideFirst={it.hideFirst} />
    </ToolTip>
  })
  return <div className='manager-list version-switch manager-versions manager-extensions'>
    <div className='list-top'>
      <span className='header no-button'>{$('Extensions')}</span>
    </div>
    <div className='container'>
      <div className='scrollable'>
        <div>{arr}</div>
      </div>
    </div>
  </div>
}

export default Extensions
