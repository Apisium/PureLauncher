import React, { createRef, useState } from 'react'
import Dialog from 'rc-dialog'
import isDev from './utils/isDev'
import history from './utils/history'
import LiveRoute from './components/LiveRoute'
import { render, unmountComponentAtNode } from 'react-dom'
import { ipcRenderer } from 'electron'
import { Router } from 'react-router-dom'

import Provider from './models/index'

import Home from './routes/Home'
import Settings from './routes/Settings'
import Manager from './routes/Manager'
import ErrorPage from './routes/Error'
import SideBar from './SideBar'
import InstallList from './components/InstallList'

ipcRenderer.on('pure-launcher-reload', () => location.reload())
const ref = createRef()
require('./i18n').setInstance(ref)

const PluginRoutes: React.FC = () => {
  (window as any).__routerUpdater = useState(false)
  return React.createElement(React.Fragment, null, ...pluginMaster.routes)
}

const App: React.FC = () => {
  try {
    return (
      <Provider>
        <Router ref={ref as any} history={history}>
          <SideBar />
          <section id='main-content' className='scrollable'>
            <LiveRoute exact component={Home} path='/' />
            <LiveRoute component={Manager} path='/manager/:type' className='vh100' />
            <LiveRoute exact component={Settings} path='/settings' />
            <LiveRoute exact component={ErrorPage} path='/error' className='vh100' />
            {/* <Redirect to='/manager/versions' /> */}
            <PluginRoutes />
          </section>
        </Router>
        <InstallList />
      </Provider>
    )
  } catch (e) {
    if (!isDev) location.reload()
    console.log(e)
    return <h1>Error: {e}</h1>
  }
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
      footer={[
        <button key='ok' className='btn btn-primary' onClick={() => fn(true)}>{$('OK')}</button>,
        data.cancelButton && <button key='cancel' className='btn btn-secondary' onClick={() => fn(false)}>
          {$('CANCEL')}</button>
      ]}
    />
  }
  render(<E />, elm)
})

export default App
