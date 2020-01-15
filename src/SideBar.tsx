import './side-bar.less'
import React, { useState } from 'react'
import ToolTip from 'rc-tooltip'
import Profile from './components/Profile'
import Dropdown from './components/Dropdown'
import LoginDialog from './components/LoginDialog'
import VersionSwitch from './components/VersionSwitch'
import Avatar from './components/Avatar'
import GameStore, { STATUS } from './models/GameStore'
import ProfilesStore from './models/ProfilesStore'
import { Textfit } from 'react-textfit'
import { Link, useLocation } from 'react-router-dom'
import { getPages } from './routes/Manager'
import { useStore } from 'reqwq'
import { join } from 'path'
import { skinsDir } from './utils/index'
import { AnimatePresence, motion } from 'framer-motion'

const homeIcon = require('./assets/images/written_book.png')
const settingsIcon = require('./assets/images/redstone.png')
const managerIcon = require('./assets/images/compass_19.png')

const SideBar: React.FC = () => {
  const pages = getPages()
  const [open, setOpen] = useState(false)
  const [openProfile, setProfile] = useState(false)
  const [openSwitch, setSwitch] = useState(false)
  const { pathname } = useLocation()
  const pm = useStore(ProfilesStore)
  const noTitle = $('No Title')
  const lastRelease = $('last-release')
  const lastSnapshot = $('last-snapshot')
  const openVersionSwitch = () => setSwitch(true)
  const gs = useStore(GameStore)
  const ver = pm.selectedVersion
  const u = pm.getCurrentProfile()
  const logged = !!u
  const versionName = `${ver.type === 'latest-release' ? lastRelease
    : ver.type === 'latest-snapshot' ? lastSnapshot : ver.name || noTitle} (${ver.lastVersionId})`
  let btnText: string
  switch (gs.status) {
    case STATUS.READY:
      btnText = $('Play')
      break
    case STATUS.LAUNCHING:
      btnText = $('Launching...')
      break
    case STATUS.LAUNCHED:
      btnText = $('Launched')
      break
    case STATUS.DOWNLOADING:
      btnText = $('Downloading...')
      break
    default: btnText = $('Unknown')
  }
  const name = logged ? u.username : $('NOT LOGGED-IN')
  return (
    <div className='side-bar'>
      <ToolTip
        placement='right'
        overlay={$(logged ? 'Click here to switch accounts' : 'Click here to login')}
        defaultVisible={!logged}
      >
        <Avatar
          data-sound
          src={logged ? [
            u.skinUrl,
            join(skinsDir, u.key + '.png')
          ] : null}
          onClick={() => logged ? setProfile(true) : pm.setLoginDialogVisible()}
        />
      </ToolTip>
      <AnimatePresence exitBeforeEnter>
        <motion.p className='name' key={name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {name}</motion.p>
      </AnimatePresence>
      <ul className='list'>
        <li className={pathname === '/' ? 'active' : null}>
          <Link to='/'><img src={homeIcon} alt='' /><span data-sound>{$('Home')}</span></Link>
        </li>
        <li
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className={pathname.startsWith('/manager') ? 'active' : null}
        >
          <a href='#' onClick={e => e.preventDefault()}><img src={managerIcon} alt='' />
            <span data-sound>{$('Manager')}</span>
          </a>
        </li>
        <li className={pathname === '/settings' ? 'active' : null}>
          <Link to='/settings'><img src={settingsIcon} alt='' /><span data-sound>{$('Settings')}</span></Link>
        </li>
      </ul>
      <Dropdown open={open}>
        <ul className='top-bar'>{pages.map(it => <li key={it.path}>
          <Link to={it.path} className={pathname === it.path ? 'active' : undefined}>{it.name}</Link>
        </li>)}
        </ul>
      </Dropdown>
      <button className='btn btn-primary launch' onClick={() => gs.launch()} disabled={gs.status !== STATUS.READY}>
        <i className='iconfont icon-icons-minecraft_pic' /><Textfit mode='single'>{btnText}</Textfit>
      </button>
      <a className='version' role='button' data-sound onClick={openVersionSwitch}>
        {$('Version')}: <span data-sound>{versionName}</span>
      </a>
      <a className='version' role='button' data-sound style={{ margin: 0 }} onClick={openVersionSwitch}>
        [{$('Click here to switch versions')}]
      </a>
      <Profile onClose={() => setProfile(false)} open={openProfile} />
      <LoginDialog onClose={() => pm.setLoginDialogVisible(false)} open={pm.loginDialogVisible} />
      <VersionSwitch onClose={() => setSwitch(false)} open={openSwitch} />
    </div>
  )
}

export default SideBar
