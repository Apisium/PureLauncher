import React, { createRef, useState } from 'react'
import Dialog from 'rc-dialog'
import SideBar from './SideBar'
import LiveRoute from './components/LiveRoute'
import { ROUTES } from './plugin/Plugin'
import { render, unmountComponentAtNode } from 'react-dom'
import { ipcRenderer } from 'electron'
import { HashRouter, Redirect } from 'react-router-dom'

import Provider from './models/index'
import Home from './routes/Home'
import Settings from './routes/Settings'
import Manager from './routes/Manager'

import Master from './plugin/index'

import InstallList from './components/InstallList'

Object.defineProperty(window, 'pluginMaster', { value: new Master() })

Object.defineProperty(window, 'PureLauncherPluginExports', {
  value: Object.freeze(require('./plugin/exports'))
})

ipcRenderer.on('pure-launcher-reload', () => location.reload())
const ref = createRef()
require('./i18n').setInstance(ref)

const PluginRoutes: React.FC = () => {
  (window as any).__routerUpdater = useState(false)
  return React.createElement(React.Fragment, null, ...pluginMaster[ROUTES])
}

const App: React.FC = () => {
  return (
    <Provider>
      <HashRouter ref={ref as any}>
        <SideBar />
        <section id='main-content' className='scroll-bar'>
          <LiveRoute component={Home} path='/home' />
          <LiveRoute component={Manager} path='/manager/:type' />
          <LiveRoute component={Settings} path='/settings' />
          <Redirect to='/manager/extensions' />
          <PluginRoutes />
        </section>
      </HashRouter>
      <InstallList />
    </Provider>
  )
}

global.openConfirmDialog = (data: { text: string, title?: string, cancelButton?: boolean }) => new Promise(r => {
  const elm = document.createElement('div')
  const E = () => {
    const [open, setOpen] = useState(true)
    const fn = (t: boolean) => {
      r(t)
      setOpen(false)
      setTimeout(unmountComponentAtNode, 1000, elm)
    }
    return <Dialog
      visible={open}
      animation='zoom'
      destroyOnClose
      maskAnimation='fade'
      onClose={() => fn(false)}
      title={data.title || $('News:')}
      children={data.text}
      footer={<>
        <button className='btn btn-primary' onClick={() => fn(true)}>{$('OK')}</button>
        {data.cancelButton && <button className='btn btn-secondary' onClick={() => fn(false)}>{$('CANCEL')}</button>}
      </>}
    />
  }
  render(<E />, elm)
})

export default App
