import React, { PureComponent } from 'react'
import { VelocityComponent } from 'velocity-react'

class Container extends PureComponent<{
  customStyles?: any
  style: any
  decorators: any
  terminal: any
  onClick: any
  onSelect?: any
  animations: any
  node: any
}> {
  renderToggle () {
    const { animations } = this.props

    if (!animations) {
      return this.renderToggleDecorator()
    }

    return (
      <VelocityComponent animation={animations.toggle.animation} duration={animations.toggle.duration}>
        {this.renderToggleDecorator()}
      </VelocityComponent>
    )
  }

  renderToggleDecorator () {
    const { style, decorators, onClick } = this.props
    return <decorators.Toggle style={style.toggle} onClick={onClick} />
  }

  render () {
    const {
      style, decorators, terminal, node, onSelect, customStyles
    } = this.props
    return (
      <div style={node.active ? { ...style.container } : { ...style.link }}>
        {!terminal ? this.renderToggle() : null}
        <decorators.Header node={node} style={style.header} customStyles={customStyles || {}} onSelect={onSelect} />
      </div>
    )
  }
}

export default Container
