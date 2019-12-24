import './avatar.css'
import React from 'react'
import Img from 'react-image'

const steve = require('../assets/images/steve.png')

const Avatar: React.FC<React.HTMLAttributes<HTMLDivElement> & { src: string | string[] }> =
  ({ src, className = '', ...props }) => <div {...props} className={className + ' avatar'}>
    <Img src={src || steve} loader={<img src={steve} alt={$('Avatar')} />} />
    <Img src={src} className='cover' />
  </div>

export default Avatar
