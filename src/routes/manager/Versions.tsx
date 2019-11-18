import './list.less'
import React from 'react'
import moment from 'moment'
import ProfilesStore from '../../models/ProfilesStore'
import { useStore } from 'reqwq'

const Versions: React.FC = () => {
  const pm = useStore(ProfilesStore)
  const noTitle = $('No Title')
  const unknown = $('Unknown')
  const lastPlayed = $('Last played')
  const lastRelease = $('last-release')
  const lastSnapshot = $('last-snapshot')
  return <div className='manager-list version-switch manager-versions'>
    <div className='list-top'>
      <span className='header'>{$('Versions List')}</span>
      <a className='add-btn'><i data-sound className='iconfont icon-shuliang-zengjia_o' />
        <span data-sound>{$('Add new...')}</span></a>
    </div>
    <ul className='scroll-bar'>
      {Object
        .entries(pm.profiles)
        .filter(([_, ver]) => ver.type !== 'latest-snapshot' || pm.settings.enableSnapshots)
        .map(([key, ver]) => ({ ...ver, key, lastUsed: moment(ver.lastUsed) }))
        .sort((a, b) => b.lastUsed.valueOf() - a.lastUsed.valueOf())
        .map(ver => <li key={ver.key}>{ver.type === 'latest-release' ? lastRelease
          : ver.type === 'latest-snapshot' ? lastSnapshot : ver.name || noTitle
        }
        <span>({ver.lastVersionId})</span>
        <div className='time'>{lastPlayed}: {ver.lastUsed.valueOf() ? ver.lastUsed.fromNow() : unknown}</div>
        <div className='buttons'>
          <button className='btn2'>{$('Mods')}</button>
          <button className='btn2 danger'>{$('Delete')}</button>
        </div>
        </li>)
      }
    </ul>
  </div>
}

export default Versions
