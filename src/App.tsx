import React, { createRef, useState } from 'react'
import Dialog from 'rc-dialog'
import SideBar from './SideBar'
import useRoute from './useRoute'
import { render, unmountComponentAtNode } from 'react-dom'
import { ipcRenderer } from 'electron'
import { HashRouter, Redirect } from 'react-router-dom'

import Provider from './models/index'
import Home from './routes/Home'
import Settings from './routes/Settings'
import Manager from './routes/Manager'

import plugins from './plugin/internal/index'
import Master from './plugin/index'

import InstallList from './components/InstallList'

Object.defineProperty(window, 'pluginMaster', { value: new Master() })
plugins.forEach(it => pluginMaster.loadPlugin(it))

Object.defineProperty(window, 'PureLauncherPluginExports', {
  value: Object.freeze(require('./plugin/exports'))
})

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
