import './manager.css'
import React from 'react'
import Dots from '../components/Dots'
import useRouter from 'use-react-router'
import useRoute from '../useRoute'

import Versions from './manager/Versions'
import Downloads from './manager/Downloads'

export const getPages = () => [
  {
    name: $('Versions'),
    path: '/manager/versions'
  },
  {
    name: $('Downloads'),
    path: '/manager/downloads'
  },
  // {
  //   name: $('Resources'),
  //   path: '/manager/resources'
  // },
  {
    name: $('Saves'),
    path: '/manager/saves'
  }
]

const Manager: React.FC = () => {
  const pages = getPages()
  const { location: { pathname }, history } = useRouter()
  const onChange = (i: number) => history.push(pages[i].path)

  const versions = useRoute(Versions, '/manager/versions')
  const downloads = useRoute(Downloads, '/manager/downloads')

  return <div className='manager'>
    {versions}{downloads}
    <Dots
      count={pages.length}
      onChange={onChange}
      names={pages.map(it => it.name)}
      active={pages.findIndex(it => it.path === pathname)}
    />
  </div>
}

export default Manager
