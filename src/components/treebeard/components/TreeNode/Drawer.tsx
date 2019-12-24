import React from 'react'
import { VelocityTransitionGroup } from 'velocity-react'

const Drawer = ({ restAnimationInfo, children }) => (
  <VelocityTransitionGroup {...restAnimationInfo}>
    {children}
  </VelocityTransitionGroup>
)

export default Drawer
