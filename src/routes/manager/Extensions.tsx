import './list.less'
import React from 'react'

const Extensions: React.FC = () => {
  return <div className='manager-list version-switch manager-versions manager-extensions'>
    <div className='list-top'>
      <span className='header'>{$('Extensions')}</span>
    </div>
    <div className='extensions'>
      <section>
        <img alt='logo' />
      </section>
    </div>
  </div>
}

export default Extensions
