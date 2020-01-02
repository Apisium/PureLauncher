import './manager.css'
import React from 'react'
import Dots from '../components/Dots'
import useRouter from 'use-react-router'
import useRoute from '../useRoute'

import Versions from './manager/Versions'
import Downloads from './manager/Downloads'
import Profiles from './manager/Profiles'
import Extensions from './manager/Extensions'

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
    {pages.map(it => useRoute(it.component, it.path, it.path))}
    <Dots
      count={pages.length}
      onChange={onChange}
      names={pages.map(it => it.name)}
      active={pages.findIndex(it => it.path === pathname)}
    />
  </div>
}

export default Manager
