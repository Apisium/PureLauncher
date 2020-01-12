import React, { createRef, Component } from 'react'
import LRoute from 'react-live-route'
import { withRouter, RouteProps } from 'react-router-dom'

const Route = withRouter<any, any>(LRoute)

export type Props = RouteProps & { onHide?: () => void, onReappear?: () => void }
export default class LiveRoute extends Component<Props> {
  private ref = createRef<any>()
  private handleHide = () => {
    if (this.ref.current) {
      const d = this.ref.current.routeDom
      const style = d.style
      style.position = 'absolute'
      style.opacity = '0'
      setTimeout(() => d.classList.add('hide'), 500)
    }
    if (this.props.onHide) this.props.onHide()
  }
  private handleReappear = () => {
    if (this.ref.current) {
      const d = this.ref.current.routeDom
      const style = d.style
      process.nextTick(() => {
        style.position = ''
        style.opacity = '1'
        d.classList.remove('hide')
      })
    }
    if (this.props.onReappear) this.props.onReappear()
  }
  public shouldComponentUpdate () { return false }
  public render () {
    const ref = this.ref
    return <Route
      {...this.props}
      alwaysLive
      wrappedComponentRef={ref}
      onHide={this.handleHide}
      onReappear={this.handleReappear}
    />
  }
}
