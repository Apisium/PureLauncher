import './manager.less'
import React from 'react'
import Dots from '../components/Dots'
import useRouter from 'use-react-router'
import useRoute from '../useRoute'

import Versions from './manager/Versions'

export const getPages = () => [
  {
    name: $('Versions'),
    path: '/manager/versions'
  },
  {
    name: $('Downloads'),
    path: '/manager/downloads'
  },
  {
    name: $('Resources'),
    path: '/manager/resources'
  },
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

  return <div className='manager'>
    {versions}
    <Dots
      count={pages.length}
      onChange={onChange}
      active={pages.findIndex(it => it.path === pathname)}
    />
  </div>
}

export default Manager
