import './dots.less'
import React from 'react'
import ToolTip from 'rc-tooltip'

interface P {
  count: number
  active: number
  names: string[]
  onChange: (p: number) => void
}
const Dots: React.FC<P> = props => {
  const arr = new Array(props.count)
  for (let i = 0; i < props.count; i++) {
    const active = i === props.active
    arr[i] = <ToolTip key={i} placement='top' overlay={props.names[i]}><div
      data-sound
      role='button'
      onClick={active ? () => {} : () => props.onChange(i)}
      className={active ? 'active' : undefined}
    />
    </ToolTip>
  }
  return <div className='dots'>
    {arr}
  </div>
}

export default Dots
