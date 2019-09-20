import './dropdown.less'
import React from 'react'
import posed from 'react-pose'

const Cover = posed.div({
  hoverable: true,
  hover: { width: 'auto' },
  closed: { width: 0 }
})
const Dropdown: React.FC<{ open: boolean }> = (props) =>
  <Cover pose={props.open ? 'hover' : 'closed'} className='dropdown'>
    <div className='cover'>{props.children}</div>
  </Cover>

export default Dropdown
