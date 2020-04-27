import './list.less'
import React from 'react'
import Avatar from '../../components/Avatar'
import ProfilesStore from '../../models/ProfilesStore'
import * as Auth from '../../plugin/Authenticator'
import { useStore } from 'reqwq'
import { join } from 'path'
import { SKINS_PATH } from '../../constants'
import { autoNotices } from '../../utils'

const steve = require('../../assets/images/steve.png')
const Profiles: React.FC = () => {
  const pm = useStore(ProfilesStore)
  const cp = pm.getCurrentProfile()
  return <div className='manager-list version-switch manager-versions manager-profiles'>
    <div className='list-top'>
      <span className='header'>{$('Accounts')}</span>
      <a className='add-btn' role='button' onClick={() => (pm.loginDialogVisible = true)}>
        <i data-sound className='iconfont icon-shuliang-zengjia_o' />
        <span data-sound>{$('Add account')}</span>
      </a>
    </div>
    <ul className='scrollable'>{pluginMaster.getAllProfiles().map(it => <li key={it.key}>
      <Avatar src={[it.skinUrl, join(SKINS_PATH, it.key + '.png'), steve]} />
      {it.displayName ? <>{it.username} <span>{it.displayName}</span></> : it.username}
      <div className='time'>{pluginMaster.logins[it.type][Auth.TITLE](pluginMaster.logins[it.type], it)}</div>
      <div className='buttons'>
        {(!cp || cp.key !== it.key) &&
          <button className='btn2' onClick={() => autoNotices(pm.setSelectedProfile(it.key, it.type))}>{$('Use')}</button>}
        <button
          className='btn2 danger' onClick={() => {
            autoNotices(Promise.resolve(pluginMaster.logins[it.type].logout(it.key))).finally(() => pm.i++)
          }}
        >
          {$('Log out')}
        </button>
      </div>
    </li>)}
    </ul>
  </div>
}

export default Profiles
