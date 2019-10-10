import './dropdown.less'
import React, { useState } from 'react'
import { motion } from 'framer-motion'

const poses = {
  open: { width: 'auto' },
  closed: { width: 0 }
}
const Dropdown: React.FC<{ open: boolean }> = (props) => {
  const [hover, setHover] = useState(false)
  return <motion.div
    initial={poses.closed}
    onMouseEnter={() => setHover(true)}
    onMouseLeave={() => setHover(false)}
    animate={props.open || hover ? poses.open : poses.closed}
    className='dropdown'
  >
    <div className='cover'>{props.children}</div>
  </motion.div>
}

export default Dropdown
