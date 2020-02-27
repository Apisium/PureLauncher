import './switch.less'
import React from 'react'

const Switch: React.FC<React.InputHTMLAttributes<HTMLInputElement> &
  { coverStyle?: React.CSSProperties }> = ({ coverStyle, ...props }) => {
    return <div style={coverStyle} data-sound className='switch'>
      <input data-sound role='switch' type='checkbox' {...props} />
      <div data-sound className='background' />
      <div data-sound className='slot' />
      <div data-sound className='thumb' />
    </div>
  }

export default Switch
