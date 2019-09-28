import React, { useRef } from 'react'
import LRoute from 'react-live-route'
import SideBar from './SideBar'
import { HashRouter, Redirect, withRouter } from 'react-router-dom'

import Provider from './models/index'
import Home from './routes/Home'
import Settings from './routes/Settings'
import Manager from './routes/Manager'

const Route = withRouter<any, any>(LRoute)

const useRoute = (component: React.FC, path: string) => {
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

const App: React.FC = () => {
  const home = useRoute(Home, '/home')
  const manager = useRoute(Manager, '/manager/:type')
  const settings = useRoute(Settings, '/settings')
  return (
    <Provider>
      <HashRouter>
        <SideBar />
        <section id='main-content'>
          {home}{settings}{manager}
          <Redirect to='/settings' />
        </section>
      </HashRouter>
    </Provider>
  )
}

export default App
