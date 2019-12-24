import React, { Component } from 'react'
import deepEqual from 'lodash/isEqual'
import shallowEqual from 'shallowequal'

class NodeHeader extends Component<{
  style: any
  customStyles?: any
  decorators: any
  animations: boolean | any
  node: any
  onClick: any
  onSelect: any
}> {
  shouldComponentUpdate (nextProps) {
    const props = this.props
    const nextPropKeys = Object.keys(nextProps)

    for (let i = 0; i < nextPropKeys.length; i++) {
      const key = nextPropKeys[i]
      if (key === 'animations') {
        continue
      }

      const isEqual = shallowEqual(props[key], nextProps[key])
      if (!isEqual) {
        return true
      }
    }

    return !deepEqual(props.animations, nextProps.animations, { strict: true })
  }

  render () {
    const {
      animations, decorators, node, onClick, style, onSelect, customStyles = { }
    } = this.props
    const { active, children } = node
    const terminal = !children
    let styles
    if (active) {
      styles = Object.assign(style, { container: { ...style.link, ...style.activeLink } })
    } else {
      styles = style
    }
    return (
      <decorators.Container
        animations={animations}
        decorators={decorators}
        node={node}
        onClick={onClick}
        customStyles={customStyles}
        onSelect={onSelect}
        terminal={terminal}
        style={styles}
      />
    )
  }
}

export default NodeHeader
