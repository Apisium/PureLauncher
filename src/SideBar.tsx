import './side-bar.less'
import React, { useState, useMemo, useEffect } from 'react'
import GameStore, { STATUS } from './models/GameStore'
import fs from 'fs-extra'
import ToolTip from 'rc-tooltip'
import Profile from './components/Profile'
import Dropdown from './components/Dropdown'
import LoginDialog from './components/LoginDialog'
import VersionSwitch from './components/VersionSwitch'
import Avatar from './components/Avatar'
import ProfilesStore from './models/ProfilesStore'
import fitText from './utils/fit-text'
import { Link, useLocation } from 'react-router-dom'
import { getPages } from './routes/Manager'
import { useStore } from 'reqwq'
import { join } from 'path'
import { TITLE } from './plugin/Authenticator'
import { AnimatePresence, motion } from 'framer-motion'
import { SKINS_PATH, RESOURCES_VERSIONS_INDEX_PATH } from './constants'

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
  const openVersionSwitch = () => !pm.extraJson.fold && setSwitch(true)
  const gs = useStore(GameStore)
  const ver = pm.selectedVersion
  const u = pm.getCurrentProfile()
  const logged = !!u
  const versionName = `${ver.type === 'latest-release' ? lastRelease
    : ver.type === 'latest-snapshot' ? lastSnapshot : ver.name || noTitle} (${ver.lastVersionId})`
  const [loginType, setLoginType] = useState<string>()
  useEffect(() => void pm.resolveVersion(ver.key)
    .then(id => fs.readJson(RESOURCES_VERSIONS_INDEX_PATH).catch(() => ({}))
      .then(it => setLoginType(typeof it[id]?.loginType === 'string' ? it[id].loginType : null)))
    .catch(e => {
      console.error(e)
      setLoginType(null)
    }), [ver.lastVersionId])
  const wrongAccount = loginType && logged && loginType === pm.extraJson.loginType
  let btnText: string
  let name: string
  if (logged) {
    name = u.username
    switch (gs.status) {
      case STATUS.READY:
        btnText = $(wrongAccount ? 'Wrong Account' : 'Play')
        break
      case STATUS.PREPARING:
        btnText = $('Preparing...')
        break
      case STATUS.DOWNLOADING:
        btnText = $('Downloading...')
        break
      case STATUS.LAUNCHING:
        btnText = $('Launching...')
        break
      case STATUS.LAUNCHED:
        btnText = $('Launched')
        break
      default: btnText = $('Unknown')
    }
  } else {
    btnText = $('Log in')
    name = $('NOT LOGGED-IN')
  }
  const launchBtn = <button
    className='btn btn-primary launch'
    onClick={() => logged && !wrongAccount ? gs.launch() : (pm.loginDialogVisible = true)}
    disabled={wrongAccount || gs.status !== STATUS.READY}
  >
    <i data-sound className='iconfont icon-icons-minecraft_pic' />
    <span data-sound style={{ fontSize: useMemo(() => fitText(btnText.toUpperCase(), 98, 20), [btnText]) + 'px' }}>
      {btnText}</span>
  </button>
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
            join(SKINS_PATH, u.key + '.png')
          ] : null}
          onClick={() => {
            if (pm.extraJson.fold) return
            if (logged) setProfile(true)
            else pm.loginDialogVisible = true
          }}
        />
      </ToolTip>
      <AnimatePresence exitBeforeEnter>
        <motion.p className='name' key={name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {name}</motion.p>
      </AnimatePresence>
      <ul className='list' id='sidebar-list'>
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
      {wrongAccount ? <ToolTip
        placement='right'
        overlay={$('Please use {0} to play game!', pluginMaster.logins[loginType]?.[TITLE]?.() || loginType)}
        visible
      >{launchBtn}</ToolTip> : launchBtn}
      <a className='version' role='button' data-sound onClick={openVersionSwitch}>
        {$('Version')}: <span data-sound>{versionName}</span>
      </a>
      <a className='version' id='sidebar-switch' role='button' data-sound onClick={openVersionSwitch}>
        [{$('Click here to switch versions')}]
      </a>
      <Profile onClose={() => setProfile(false)} open={openProfile} />
      <LoginDialog onClose={() => (pm.loginDialogVisible = false)} open={pm.loginDialogVisible} />
      <VersionSwitch onClose={() => setSwitch(false)} open={openSwitch} />
    </div>
  )
}

export default SideBar
