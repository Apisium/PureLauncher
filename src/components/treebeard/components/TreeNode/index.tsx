import React, { PureComponent } from 'react'
import styled from '@emotion/styled'

import defaultAnimations from '../../themes/animations'
import { randomString } from '../../util'
import { Ul } from '../common'
import NodeHeader from '../NodeHeader'
import Drawer from './Drawer'
import Loading from './Loading'

const Li = styled('li', {
  shouldForwardProp: prop => ['className', 'children', 'ref'].includes(prop)
})(((arg: any) => arg.style) as any)

class TreeNode extends PureComponent<{
  onSelect?: any
  onToggle?: any
  style: any
  customStyles?: any
  node: any
  decorators: any
  animations: any
}> {
  onClick () {
    const { node, onToggle } = this.props
    if (onToggle) {
      onToggle(node, !node.toggled)
    }
  }

  animations () {
    const { animations, node } = this.props
    if (!animations) {
      return {
        toggle: defaultAnimations.toggle(this.props, 0)
      }
    }
    const animation = Object.assign({}, animations, node.animations)
    return {
      toggle: animation.toggle(this.props),
      drawer: animation.drawer(this.props)
    }
  }

  decorators () {
    const { decorators, node } = this.props
    const nodeDecorators = node.decorators || {}

    return Object.assign({}, decorators, nodeDecorators)
  }

  renderChildren (decorators) {
    const {
      animations, decorators: propDecorators, node, style, onToggle, onSelect, customStyles
    } = this.props

    if (node.loading) {
      return (
        <Loading decorators={decorators} style={style} />
      )
    }

    let children = node.children
    if (!Array.isArray(children)) {
      children = children ? [children] : []
    }

    return (
      <Ul style={style.subtree}>
        {children.map(child => (
          <TreeNode
            onSelect={onSelect}
            onToggle={onToggle}
            animations={animations}
            style={style}
            customStyles={customStyles}
            decorators={propDecorators}
            key={child.id || randomString()}
            node={child}
          />
        ))}
      </Ul>
    )
  }

  render () {
    const {
      node, style, onSelect, customStyles
    } = this.props
    const decorators = this.decorators()
    const animations = this.animations()
    const { ...restAnimationInfo } = animations.drawer
    return (
      <Li style={style.base}>
        <NodeHeader
          decorators={decorators}
          animations={animations}
          node={node}
          style={style}
          customStyles={customStyles || {}}
          onClick={() => this.onClick()}
          onSelect={typeof onSelect === 'function' ? () => onSelect(node) : undefined}
        />
        <Drawer restAnimationInfo={{ ...restAnimationInfo }}>
          {node.toggled ? this.renderChildren(decorators) : null}
        </Drawer>
      </Li>
    )
  }
}

export default TreeNode
