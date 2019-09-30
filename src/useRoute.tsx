import React, { useRef } from 'react'
import LRoute from 'react-live-route'
import { withRouter } from 'react-router-dom'

const Route = withRouter<any, any>(LRoute)

export default (component: React.FC, path: string) => {
  const ref = useRef<{ routeDom: HTMLDivElement }>()
  return <Route
    alwaysLive
    wrappedComponentRef={ref}
    component={component}
    path={path}
    onHide={() => {
      const style = ref.current.routeDom.style
      style.position = 'absolute'
      style.opacity = '0'
      setTimeout(() => (ref.current.routeDom.classList.add('hide')), 400)
    }}
    onReappear={() => {
      ref.current.routeDom.classList.remove('hide')
      const style = ref.current.routeDom.style
      process.nextTick(() => {
        style.position = ''
        style.opacity = '1'
      })
    }}
  />
}
