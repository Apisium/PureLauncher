import './list.less'
import '../../components/progress.css'
import React, { useState } from 'react'

const Downloads: React.FC = () => {
  const [a, b] = useState(false)
  return <div className='manager-list version-switch manager-versions manager-downloads'>
    <div className='list-top'>
      <span className='header'>{$('Downloads')}</span>
      <a className='add-btn'><i data-sound className='iconfont icon-shuliang-zengjia_o' />
        <span data-sound>{$('Add new...')}</span></a>
    </div>
    <progress value={-1} max={100} />
    <ul>
      <li onClick={() => b(!a)}>
        <div className='time'>wwww</div>
      </li>
    </ul>
  </div>
}

export default Downloads
