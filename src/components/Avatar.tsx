import './avatar.css'
import React, { forwardRef } from 'react'
import Img from 'react-image'
import { AnimatePresence, motion } from 'framer-motion'

const steve = require('../assets/images/steve.png')
const Div = motion.div

const Avatar: React.FC<React.HTMLAttributes<HTMLDivElement> & { src: string | string[] }> =
  forwardRef(({ src, className = '', ...props }, ref) => <AnimatePresence exitBeforeEnter>
    <Div
      {...(props as any)}
      ref={ref as any}
      key={Array.isArray(src) ? src[0] : src}
      className={className + ' avatar'}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Img
        src={src || steve}
        loader={<img src={steve} alt={$('Avatar')} />}
        unloader={<img src={steve} alt={$('Avatar')} />}
      />
      <Img src={src} className='cover' />
    </Div>
  </AnimatePresence>)

export default Avatar
