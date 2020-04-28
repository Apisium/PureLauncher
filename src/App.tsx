import React, { createRef, useState, useEffect } from 'react'
import Dialog from 'rc-dialog'
import isDev from './utils/isDev'
import history from './utils/history'
import LiveRoute from './components/LiveRoute'
import { ipcRenderer } from 'electron'
import { render, unmountComponentAtNode } from 'react-dom'
import { Router, Redirect, Route } from 'react-router-dom'

import Provider from './models/index'
import installLocal, { installMod } from './protocol/install-local'

import Home from './routes/Home'
import Settings from './routes/Settings'
import Manager from './routes/Manager'
import ErrorPage from './routes/Error'
import ServerHome from './routes/ServerHome'
import CustomServerHome from './routes/CustomServerHome'
import SideBar from './SideBar'
import InstallList from './components/InstallList'
import Loading from './components/Loading'

ipcRenderer.on('pure-launcher-reload', () => location.reload())
const ref = createRef()
require('./i18n').setInstance(ref)

const PluginRoutes: React.FC = () => {
  (window as any).__routerUpdater = useState(false)
  return React.createElement(React.Fragment, null, ...pluginMaster.routes)
}

document.ondragenter = e => e.preventDefault()
const Drag: React.FC = () => {
  const [show, setShow] = useState(false)
  useEffect(() => {
    document.ondrop = e => {
      e.preventDefault()
      setShow(false)
      pluginMaster.emitSync('dragIn', e.dataTransfer)
      const files = e.dataTransfer.files
      if (files && files.length) {
        const file = files.item(0)
        console.log(file)
        if (file && file.size) {
          if (file.type === 'application/x-zip-compressed') {
            notice({ content: $('Installing resources...') })
            installLocal(file.path, true, true)
              .then(success => {
                if (success) notice({ content: $('Success!') })
                else notice({ content: $('Failed!') })
              })
              .catch(e => notice({ content: e ? e.message : $('Failed!'), error: true }))
          } else if (file.name.endsWith('.jar')) {
            notice({ content: $('Installing resources...') })
            installMod(file.path)
              .then(success => {
                if (success) notice({ content: $('Success!') })
                else notice({ content: $('Failed!') })
              })
              .catch(e => notice({ content: e ? e.message : $('Failed!'), error: true }))
          } else pluginMaster.emitSync('fileDragIn', file)
        }
      }
    }
    document.ondragover = e => {
      e.preventDefault()
      setShow(true)
    }
    document.ondragleave = e => {
      e.preventDefault()
      setShow(false)
    }
    return () => {
      document.ondrop = null
      document.ondragover = null
      document.ondragleave = null
    }
  }, [])
  return <div id='pl-drag' style={{ opacity: +show }}>
    <i className='iconfont icon-tuoruwenjian' />
    <p>{$('File drag detected, release to install.')}</p>
  </div>
}

const LoadingPage = () => <div style={{ flex: 1, display: 'flex' }}><Loading /></div>

const App: React.FC = () => {
  try {
    return (
      <Provider>
        <Router ref={ref as any} history={history}>
          <SideBar />
          <section id='main-content' className='scrollable'>
            {!(window as any).__indexUrl && <LiveRoute exact component={Home} path='/' />}
            <LiveRoute component={Manager} path='/manager/:type' className='vh100' />
            <LiveRoute exact component={Settings} path='/settings' />
            <LiveRoute exact component={ErrorPage} path='/error' className='vh100' />
            <LiveRoute exact component={ServerHome} path='/serverHome' className='vh100' />
            <LiveRoute exact component={LoadingPage} path='/loading' className='vh100' />
            <Route component={CustomServerHome} path='/customServerHome' className='vh100' />
            <Redirect to={(window as any).__indexUrl || '/'} />
            <PluginRoutes />
          </section>
        </Router>
        <InstallList />
        <Drag />
      </Provider>
    )
  } catch (e) {
    console.error(e)
    if (!isDev) location.reload()
    return <h1>Error: {e}</h1>
  }
}

interface Ctx { text: string, title?: string, cancelButton?: boolean, component?: React.ComponentType, ignore?: boolean }
global.openConfirmDialog = (data: Ctx) => new Promise(r => {
  const elm = document.createElement('div')
  const E = () => {
    const [open, setOpen] = useState(true)
    const fn = (t: boolean) => {
      r(t)
      setOpen(false)
      setTimeout(unmountComponentAtNode, 1000, elm)
    }
    let text = data.text
    if (data.ignore) text += '\n' + $('If you want to ignore the warning, please click the ok button.')
    return <Dialog
      visible={open}
      animation='zoom'
      destroyOnClose
      maskAnimation='fade'
      onClose={() => fn(false)}
      title={data.title || $('News:')}
      children={data.component ? <>{text}<data.component /></> : text}
      bodyStyle={{ whiteSpace: 'pre-wrap' }}
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
