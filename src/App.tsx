import React, { createRef } from 'react'
import SideBar from './SideBar'
import useRoute from './useRoute'
import { HashRouter, Redirect } from 'react-router-dom'

import Provider from './models/index'
import Home from './routes/Home'
import Settings from './routes/Settings'
import Manager from './routes/Manager'
import Master from './plugin/index'

window.pluginMaster = new Master()

const ref = createRef()
require('./i18n').setInstance(ref)

const App: React.FC = () => {
  const home = useRoute(Home, '/home')
  const manager = useRoute(Manager, '/manager/:type')
  const settings = useRoute(Settings, '/settings')
  return (
    <Provider>
      <HashRouter ref={ref as any}>
        <SideBar />
        <section id='main-content'>
          {home}{settings}{manager}
          <Redirect to='/manager/downloads' />
        </section>
      </HashRouter>
    </Provider>
  )
}

export default App
