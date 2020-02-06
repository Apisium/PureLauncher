import './manager.css'
import React from 'react'
import Dots from '../components/Dots'
import LiveRoute from '../components/LiveRoute'
import history from '../utils/history'
import { useLocation, Route } from 'react-router-dom'

import Versions from './manager/Versions'
import Downloads from './manager/Downloads'
import Profiles from './manager/Profiles'
import Extensions from './manager/Extensions'
import Plugins from './manager/Plugins'
import Mods from './manager/Mods'
import ResourcePacks from './manager/ResourcePacks'

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
  {
    name: $('Extensions'),
    path: '/manager/extensions',
    component: Extensions
  }
]

const Manager: React.FC = () => {
  const pages = getPages()
  const pathname = useLocation().pathname
  const onChange = (i: number) => history.push(pages[i].path)

  return <div className='manager'>
    <div className='container'>
      {pages.map(it => <LiveRoute exact component={it.component} path={it.path} key={it.path} />)}
      <LiveRoute exact component={Plugins} path='/manager/plugins' />
      <Route component={Mods} path='/manager/mods/:version' />
      <Route component={ResourcePacks} path='/manager/resourcePacks' />
    </div>
    <Dots
      count={pages.length}
      onChange={onChange}
      names={pages.map(it => it.name)}
      active={pages.findIndex(it => it.path === pathname)}
    />
  </div>
}

export default Manager
