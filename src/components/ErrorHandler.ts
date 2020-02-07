import React from 'react'
import history from '../utils/history'

export default class ErrorHandler extends React.Component<{ onError?: (e: any, info: string) => boolean }> {
  public static getDerivedStateFromError () { return { } }
  public componentDidCatch (e, info) {
    if (!this.props.onError || !this.props.onError(e, info)) history.push('/error')
  }
  public render () {
    return this.props.children
  }
}
