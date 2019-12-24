import React from 'react'
import styled from '@emotion/styled'

import { Div } from '../common'

const Polygon = styled('polygon', {
  shouldForwardProp: prop => ['className', 'children', 'points'].indexOf(prop) !== -1
})(((a: any) => a.style) as any)

const Toggle = ({ style, onClick }) => {
  const { height, width } = style
  const midHeight = height * 0.5
  const points = `0,0 0,${height} ${width},${midHeight}`

  return (
    <div style={style.base} onClick={onClick} role='button'>
      <Div style={style.wrapper}>
        <svg {...{ height, width }}>
          <Polygon points={points} style={style.arrow} />
        </svg>
      </Div>
    </div>
  )
}

export default Toggle
