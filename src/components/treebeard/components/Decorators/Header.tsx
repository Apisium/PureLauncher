import React from 'react'
import PropTypes from 'prop-types'

import { Div } from '../common'

const Header = ({ onSelect, node, style, customStyles }) => (
  <div style={style.base} onClick={onSelect}>
    <Div style={node.selected ? { ...style.title,
      ...((customStyles && customStyles.header && customStyles.header.title) || {}) } : style.title}>
      {node.name}
    </Div>
  </div>
)

export default Header
