import './side-bar.less'
import React, { useState } from 'react'
import moment from 'moment'
import Profile from './components/Profile'
import Dropdown from './components/Dropdown'
import VersionSwitch from './components/VersionSwitch'
import useRouter from 'use-react-router'
import ProfileModel from './models/ProfilesModel'
import { Link } from 'react-router-dom'
import { getPages } from './routes/Manager'
import { useModel } from 'use-model'

const homeIcon = require('./assets/images/written_book.png')
const settingsIcon = require('./assets/images/redstone.png')
const managerIcon = require('./assets/images/compass_19.png')

const SideBar: React.FC = () => {
  const pages = getPages()
  const [open, setOpen] = useState(false)
  const [openProfile, setProfile] = useState(false)
  const [openSwitch, setSwitch] = useState(false)
  const { location: { pathname } } = useRouter()
  const pm = useModel(ProfileModel)
  const noTitle = $('No Title')
  const lastRelease = $('last-release')
  const lastSnapshot = $('last-snapshot')
  const openVersionSwitch = () => setSwitch(true)
  const ver = Object
    .values(pm.profiles)
    .filter(it => it.type !== 'latest-snapshot' || pm.settings.enableSnapshots)
    .map(it => ({ name: it.name, type: it.type, version: it.lastVersionId, lastUsed: moment(it.lastUsed) }))
    .sort((a, b) => b.lastUsed.valueOf() - a.lastUsed.valueOf())[0] ||
      { type: 'latest-release', version: 'latest-release' }
  const versionName = `${ver.type === 'latest-release' ? lastRelease
  : ver.type === 'latest-snapshot' ? lastSnapshot : ver.name || noTitle} (${ver.version})`
  return (
    <div className='side-bar'>
      <div className='avatar' data-sound onClick={() => setProfile(true)}>
        <img src='https://minotar.net/helm/ShirasawaSama/80.png' />
      </div>
      <p className='name'>ShirasawaSama</p>
      <ul className='list'>
        <li className={pathname === '/home' ? 'active' : null}>
          <Link to='/home'><img src={homeIcon} /><span data-sound>{$('Home')}</span></Link>
        </li>
        <li
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className={pathname.startsWith('/manager') ? 'active' : null}
        >
          <a href='#' onClick={e => e.preventDefault()}><img src={managerIcon} />
          <span data-sound>{$('Manager')}</span></a>
        </li>
        <li className={pathname === '/settings' ? 'active' : null}>
          <Link to='/settings'><img src={settingsIcon} /><span data-sound>{$('Settings')}</span></Link>
        </li>
      </ul>
      <Dropdown open={open}>
        <ul className='top-bar'>{pages.map(it => <li key={it.path}>
          <Link to={it.path}>{it.name}</Link>
        </li>)}</ul>
      </Dropdown>
      <button className='btn btn-primary launch' onClick={console.log}>{$('Play')}</button>
      <p className='version' data-sound onClick={openVersionSwitch}>
        {$('Version')}: <span data-sound>{versionName}</span></p>
      <p className='version' data-sound style={{ margin: 0 }} onClick={openVersionSwitch}>
        [{$('Click here to switch versions')}]</p>
      <Profile onClose={() => setProfile(false)} open={openProfile} />
      <VersionSwitch onClose={() => setSwitch(false)} open={openSwitch} />
    </div>
  )
}

export default SideBar
