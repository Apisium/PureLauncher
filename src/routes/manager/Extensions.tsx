import './list.less'
import React from 'react'
// import IconButton from '../../components/IconButton'

const Extensions: React.FC = () => {
  return <div className='manager-list version-switch manager-versions manager-extensions'>
    <div className='list-top'>
      <span className='header'>{$('Extensions')}</span>
    </div>
    <div className='container'>
      <div className='scroll-bar'>
        <div />
      </div>
    </div>
  </div>
}

export default Extensions
