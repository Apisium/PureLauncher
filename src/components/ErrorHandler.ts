import React from 'react'
import history from '../utils/history'

const errorComponents: Record<string, () => any> = { }
history.listen(() => {
  const f = errorComponents[history.location.pathname]
  if (f) f()
})

export const AUTO_RELOAD = { autoReload: true }

export default class ErrorHandler extends React.Component<{
  onError?: (e: any, info: string) => boolean
  autoReload?: boolean
}> {
  public state = { error: false }
  private cachePath: string
  public static getDerivedStateFromError () { return { error: true } }
  public componentDidCatch (e, info) {
    if (this.props.autoReload) {
      errorComponents[this.cachePath = history.location.pathname] = () => this.setState({ error: false })
    }
    if (!this.props.onError || !this.props.onError(e, info)) history.push('/error')
  }
  public UNSAFE_componentWillUpdate () {
    if (this.cachePath) {
      delete errorComponents[this.cachePath]
      this.cachePath = null
    }
  }
  public render () {
    return this.state.error ? React.createElement('div', {}) : this.props.children
  }
}
