import './side-bar.less'
import React, { useState } from 'react'
import Profile from './components/Profile'
import Dropdown from './components/Dropdown'
import useRouter from 'use-react-router'
import { Link } from 'react-router-dom'

const homeIcon = require('./assets/images/written_book.png')
const settingsIcon = require('./assets/images/redstone.png')
const managerIcon = require('./assets/images/compass_19.png')

const pages = [
  {
    name: '版本',
    path: '/manager/versions'
  },
  {
    name: '模组',
    path: '/manager/mods'
  },
  {
    name: '地图',
    path: '/manager/levels'
  },
  {
    name: '材质',
    path: '/manager/resources'
  },
  {
    name: '截图',
    path: '/manager/screenshots'
  }
]

const SideBar: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [openProfile, setProfile] = useState(false)
  const { location: { pathname } } = useRouter()
  return (
    <div className='side-bar'>
      <div className='avatar' onClick={() => setProfile(true)}>
        <img src='https://minotar.net/helm/ShirasawaSama/80.png' />
      </div>
      <p className='name'>ShirasawaSama</p>
      <ul className='list'>
        <li className={pathname === '/home' ? 'active' : null}>
          <Link to='/home'><img src={homeIcon} /><span data-sound>主页</span></Link>
        </li>
        <li
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className={pathname === '/manager' ? 'active' : null}
        >
          <a href='#' onClick={e => e.preventDefault()}><img src={managerIcon} /><span data-sound>管理</span></a>
        </li>
        <li className={pathname === '/settings' ? 'active' : null}>
          <Link to='/settings'><img src={settingsIcon} /><span data-sound>设置</span></Link>
        </li>
      </ul>
      <Dropdown open={open}>
        <ul className='top-bar'>{pages.map(it => <li key={it.path}>
          <Link to={it.path}>{it.name}</Link>
        </li>)}</ul>
      </Dropdown>
      <button className='btn btn-primary launch' onClick={console.log}>启动游戏</button>
      <p className='version'>版本: <span>未命名 (1.14.4-Fabric)</span></p>
      <p className='version' style={{ margin: 0 }}>[点击这里以更换游戏版本]</p>
      <Profile onClose={() => setProfile(false)} open={openProfile} />
    </div>
  )
}

export default SideBar
