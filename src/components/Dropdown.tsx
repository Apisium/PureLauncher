import './dropdown.less'
import React from 'react'
import { motion } from 'framer-motion'

const poses = {
  open: { width: 'auto' },
  closed: { width: 0 }
}
const Dropdown: React.FC<{ open: boolean }> = (props) =>
  <motion.div
    initial={poses.closed}
    whileHover={poses.open}
    animate={props.open ? 'open' : 'closed'}
    className='dropdown'
  >
    <div className='cover'>{props.children}</div>
  </motion.div>

export default Dropdown
