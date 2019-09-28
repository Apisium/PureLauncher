import './manager.less'
import React from 'react'
import Dots from '../components/Dots'
import useRouter from 'use-react-router'
import { } from 'react-router-dom'

export const pages = [
  {
    name: '版本',
    path: '/manager/versions'
  },
  {
    name: '帐号',
    path: '/manager/profiles'
  },
  {
    name: '下载',
    path: '/manager/downloads'
  },
  {
    name: '模组',
    path: '/manager/mods'
  }
]

const Manager: React.FC = () => {
  const { location: { pathname }, history } = useRouter()
  const onChange = i => history.push(pages[i].path)
  return <div className='manager'>
    <h2>版本</h2>
    <Dots
      count={pages.length}
      onChange={onChange}
      active={pages.findIndex(it => it.path === pathname)}
    />
  </div>
}

export default Manager
