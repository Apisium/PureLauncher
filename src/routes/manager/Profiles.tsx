import './list.less'
import React from 'react'
import Avatar from '../../components/Avatar'
import ProfilesStore from '../../models/ProfilesStore'
import * as Auth from '../../plugin/Authenticator'
import { useStore } from 'reqwq'
import { join } from 'path'
import { skinsDir } from '../../utils/index'

const steve = require('../../assets/images/steve.png')
const Profiles: React.FC = () => {
  const pm = useStore(ProfilesStore)
  return <div className='manager-list version-switch manager-versions manager-profiles'>
    <div className='list-top'>
      <span className='header'>{$('Accounts')}</span>
      <a className='add-btn' role='button' onClick={() => pm.setLoginDialogVisible()}>
        <i data-sound className='iconfont icon-shuliang-zengjia_o' />
        <span data-sound>{$('Add account')}</span>
      </a>
    </div>
    <ul className='scroll-bar'>{pluginMaster.getAllProfiles().map(it => <li key={it.key}>
      <Avatar src={[it.skinUrl, join(skinsDir, it.key + '.png'), steve]} />
      {it.displayName ? <>{it.username} <span>{it.displayName}</span></> : it.username}
      <div className='time'>{pluginMaster.logins[it.type][Auth.TITLE]()}</div>
      <div className='buttons'>
        <button
          className='btn2' onClick={() =>
            pm.setSelectedProfile(it.key, it.type)
              .then(() => notice({ content: $('Success!') }))
              .catch(e => {
                console.error(e)
                notice({ content: $('Failed!'), error: true })
              })}
        >{$('Use')}
        </button>
        <button className='btn2 danger'>{$('Log out')}</button>
      </div>
    </li>)}
    </ul>
  </div>
}

export default Profiles
