import './list.less'
import React from 'react'
import ProfilesModel from '../../models/ProfilesModel'
import * as Auth from '../../plugin/Authenticator'
import { useModel } from 'use-model'

const Profiles: React.FC = () => {
  const pm = useModel(ProfilesModel)
  return <div className='manager-list version-switch manager-versions manager-profiles'>
    <div className='list-top'>
      <span className='header'>{$('Accounts')}</span>
      <a className='add-btn'>
        <i data-sound className='iconfont icon-shuliang-zengjia_o' />
        <span data-sound>{$('Add account')}</span>
      </a>
    </div>
    <ul>{pluginMaster.getAllProfiles().map(it => <li key={it.key}>
      {it.displayName ? <>{it.username} <span>{it.displayName}</span></> : it.username}
      <div className='time'>{pluginMaster.logins[it.type][Auth.TITLE]()}</div>
      <div className='buttons'>
        <button className='btn2'>{$('Use')}</button>
        <button className='btn2 danger'>{$('Log out')}</button>
      </div>
    </li>)}
    </ul>
  </div>
}

export default Profiles
