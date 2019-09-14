import './switch.less'
import React from 'react'

const Switch: React.FC<React.InputHTMLAttributes<HTMLInputElement> &
  { coverStyle?: React.CSSProperties }> = ({ coverStyle, ...props }) => {
    return <div style={coverStyle} className='switch'>
      <input role='switch' type='checkbox' {...props} />
      <div className='background'/>
      <div className='slot'/>
      <div className='thumb' />
    </div>
  }

export default Switch
