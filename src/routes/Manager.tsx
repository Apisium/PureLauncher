import './manager.css'
import React from 'react'
import Dots from '../components/Dots'
import useRouter from 'use-react-router'
import LiveRoute from '../components/LiveRoute'

import Versions from './manager/Versions'
import Downloads from './manager/Downloads'
import Profiles from './manager/Profiles'
import Extensions from './manager/Extensions'
import Plugins from './manager/Plugins'

export const getPages = () => [
  {
    name: $('Versions'),
    path: '/manager/versions',
    component: Versions
  },
  {
    name: $('Accounts'),
    path: '/manager/accounts',
    component: Profiles
  },
  {
    name: $('Downloads'),
    path: '/manager/downloads',
    component: Downloads
  },
  // {
  //   name: $('Resources'),
  //   path: '/manager/resources'
  // },
  // {
  //   name: $('Saves'),
  //   path: '/manager/saves'
  // },
  {
    name: $('Extensions'),
    path: '/manager/extensions',
    component: Extensions
  }
]

const Manager: React.FC = () => {
  const pages = getPages()
  const { location: { pathname }, history } = useRouter()
  const onChange = (i: number) => history.push(pages[i].path)

  return <div className='manager'>
    {pages.map(it => <LiveRoute component={it.component} path={it.path} key={it.path} />)}
    <LiveRoute component={Plugins} path='/manager/plugins' />
    <Dots
      count={pages.length}
      onChange={onChange}
      names={pages.map(it => it.name)}
      active={pages.findIndex(it => it.path === pathname)}
    />
  </div>
}

export default Manager
