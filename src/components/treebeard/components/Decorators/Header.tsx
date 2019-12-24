import React from 'react'

import { Div } from '../common'

/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
const Header = ({ onSelect, node, style, customStyles }) => (
  <div style={style.base} onClick={onSelect} role='heading'>
    <Div style={node.selected ? { ...style.title,
      ...((customStyles && customStyles.header && customStyles.header.title) || {}) } : style.title}
    >
      {node.name}
    </Div>
  </div>
)

export default Header
