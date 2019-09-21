import './dots.less'
import React from 'react'

interface P {
  count: number
  active: number
  onChange: (p: number) => void
}
const Dots: React.FC<P> = props => {
  const arr = new Array(props.count)
  for (let i = 0; i < props.count; i++) {
    const active = i === props.active
    arr[i] = <div
      key={i}
      onClick={active ? () => {} : () => props.onChange(i)}
      className={active ? 'active' : undefined}
    />
  }
  return <div className='dots'>
    {arr}
  </div>
}

export default Dots
