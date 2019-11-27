import React, { createRef } from 'react'
import SideBar from './SideBar'
import useRoute from './useRoute'
import { ipcRenderer } from 'electron'
import { HashRouter, Redirect } from 'react-router-dom'

import Provider from './models/index'
import Home from './routes/Home'
import Settings from './routes/Settings'
import Manager from './routes/Manager'

import plugins from './plugin/internal/index'
import Master from './plugin/index'

import InstallList from './components/InstallList'

window.pluginMaster = new Master()
plugins.forEach(it => pluginMaster.loadPlugin(it))

ipcRenderer.on('pure-launcher-reload', () => location.reload())

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
        <section id='main-content' className='scroll-bar'>
          {home}{settings}{manager}
          <Redirect to='/manager/downloads' />
        </section>
      </HashRouter>
      <InstallList />
    </Provider>
  )
}

export default App
