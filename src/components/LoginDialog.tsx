import './login-dialog.less'
import React, { useState } from 'react'
import Dialog from 'rc-dialog'
import { shell } from 'electron'
import { Link } from 'react-router-dom'
import * as Auth from '../plugin/Authenticator'

const getObjectLength = (obj: any) => {
  let i = 0
  for (const _ in obj) i++
  return i
}
const LoginDialog: React.FC<{ open: boolean, onClose: () => void }> = props => {
  const [type, setType] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const currentLogin = pluginMaster.logins[type]
  let width: number
  if (!type) {
    const len = getObjectLength(pluginMaster.logins)
    width = len > 3 ? 570 / len - 30 : 130
  }
  return <Dialog
    animation='zoom'
    maskAnimation='fade'
    className='login-dialog'
    visible={props.open}
    onClose={() => !loading && props.onClose()}
  >
    {type === ''
      ? <>
        <p className='title'>{$('Choose your account login mode. If you don\'t have the online version, please choose the "Offline Login" on the right')}</p>
        <Link to='/manager/accounts' className='title title2' onClick={props.onClose}>
          {$('Have already logged in? Click here!')}</Link>
        <div className='heads'>
          {Object.values(pluginMaster.logins).map(it => <div key={it[Auth.NAME]}>
            <div
              data-sound
              className='head'
              onClick={() => {
                setSubmitted(false)
                setType(it[Auth.NAME])
              }}
              style={{ backgroundImage: `url(${it[Auth.IMAGE]})`, width, height: width }}
            />
            <p>{it[Auth.TITLE]()}</p>
          </div>)}
        </div>
      </>
      : <form
        key={type}
        className={submitted ? 'submitted' : undefined}
        onInvalid={() => setSubmitted(true)}
        onSubmit={e => {
          setSubmitted(true)
          e.preventDefault()
          setLoading(true)
          const data = { }
          new FormData(e.target as HTMLFormElement).forEach((v, k) => (data[k] = v))
          currentLogin
            .login(data)
            .then(key => profilesStore.setSelectedProfile(key, currentLogin))
            .then(() => {
              notice({ content: $('Login succeeded!') })
              props.onClose()
            })
            .catch(err => notice({ content: err.message, error: true })) // TODO:
            .finally(() => setLoading(false))
        }}>
        {(currentLogin[Auth.FIELDS] as Auth.Field[]).map(it => <React.Fragment key={it.name}>
          <label htmlFor={it.name}>{it.title()}</label>
          <div className={'input2 ' + (loading ? 'disabled' : '')}>
            <input {...it.inputProps} name={it.name} disabled={loading} id={it.name} />
            <div className='dot0' />
            <div className='dot1' />
            <div className='dot2' />
            <div className='dot3' />
          </div>
        </React.Fragment>)}
        <div className='links'>
          <span data-sound className='left' onClick={() => !loading && setType('')}>{$('Back')}</span>
          {currentLogin[Auth.LINK] &&
            <span data-sound className='right'
              onClick={() => shell.openExternal(currentLogin[Auth.LINK].url())}>
              {currentLogin[Auth.LINK].name()}
            </span>
          }
        </div>
        <button
          type='submit'
          className='btn3'
          disabled={loading}
          style={{ marginTop: 8, width: '100%' }}
        >{$(loading ? 'Loading...' : 'Log in')}</button>
      </form>
    }
  </Dialog>
}

export default LoginDialog
