import React from 'react'

import defaultTheme from '../themes/default'
import defaultAnimations from '../themes/animations'
import { randomString } from '../util'
import { Ul } from './common'
import defaultDecorators from './Decorators'
import TreeNode from './TreeNode'

const TreeBeard = ({
  animations = defaultAnimations, decorators = defaultDecorators, data, onToggle = null,
  style = defaultTheme, onSelect = null, customStyles = {} as any
}) => (
  <Ul style={{ ...defaultTheme.tree.base, ...style.tree.base }}>
    {(Array.isArray(data) ? data : [data]).map(node => (
      <TreeNode
        decorators={decorators}
        node={node}
        onToggle={onToggle}
        animations={animations}
        onSelect={onSelect}
        customStyles={customStyles}
        key={node.id || randomString()}
        style={{ ...defaultTheme.tree.node, ...style.tree.node }}
      />
    ))}
  </Ul>
)

export default TreeBeard
