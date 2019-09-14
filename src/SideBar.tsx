import './side-bar.less'
import React from 'react'
import useRouter from 'use-react-router'
import { Link } from 'react-router-dom'

const pages = [
  {
    path: '/home',
    name: '主页',
    icon: require('./assets/images/written_book.png')
  },
  {
    path: '/settings',
    name: '设置',
    icon: require('./assets/images/compass_19.png')
  },
  {
    path: '/versions',
    name: '管理',
    icon: require('./assets/images/redstone.png')
  }
]

const SideBar: React.FC = () => {
  const { location: { pathname } } = useRouter()
  return (
    <div className='side-bar'>
      <div className='avatar'>
        <img src='https://minotar.net/helm/ShirasawaSama/80.png' />
      </div>
      <p className='name'>ShirasawaSama</p>
      <ul className='list'>
        {pages.map(it => <li key={it.path} className={pathname === it.path ? 'active' : null}>
          <Link to={it.path}><img src={it.icon} /><span data-sound>{it.name}</span></Link>
        </li>)}
      </ul>
      <button className='btn btn-primary launch' onClick={console.log}>启动游戏</button>
      <p className='version'>版本: <span>未命名 (1.14.4-Fabric)</span></p>
      <p className='version' style={{ margin: 0 }}>[点击这里以更换游戏版本]</p>
    </div>
  )
}

export default SideBar
