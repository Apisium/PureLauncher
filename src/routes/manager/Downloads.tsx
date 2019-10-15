import './list.less'
import React from 'react'
import DownloadsModel from '../../models/DownloadsModel'
import { useModel } from 'use-model'

const Downloads: React.FC = () => {
  const dm = useModel(DownloadsModel)
  return <div className='manager-list version-switch manager-versions manager-downloads'>
    <div className='list-top'>
      <span className='header'>{$('Downloads')}</span>
      <a className='add-btn' onClick={dm.clear}>
        <i data-sound className='iconfont icon-shanchu_o' />
        <span data-sound>{$('Clear')}</span>
      </a>
    </div>
    <ul className='scroll-bar'>{Object.entries(dm.list).map(([key, item]) => <li key={key}>
      {item.title ? <>{item.title} <span>{item.filename}</span></> : item.filename}
      <progress value={item.progress} max={100} />
    </li>)}
    </ul>
  </div>
}

export default Downloads
