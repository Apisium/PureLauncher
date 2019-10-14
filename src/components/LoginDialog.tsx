import './login-dialog.less'
import React, { useState } from 'react'
import Dialog from 'rc-dialog'
import { shell } from 'electron'
import * as Auth from '../plugin/Authenticator'

const LoginDialog: React.FC<{ open: boolean, onClose: () => void }> = props => {
  const [type, setType] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const currentLogin = pluginMaster.logins[type]
  return <Dialog className='login-dialog' visible={props.open} onClose={props.onClose}>
    {type === ''
      ? <>
          <p className='title'>{$('Choose your account login mode. If you don\'t have the online version, please choose the "Offline Login" on the right')}</p>
          <div className='heads'>
            {Object.values(pluginMaster.logins).map(it => <div key={it[Auth.NAME]}>
              <div
                data-sound
                className='head'
                onClick={() => {
                  setSubmitted(false)
                  setType(it[Auth.NAME])
                }}
                style={{ backgroundImage: `url(${it[Auth.IMAGE]})` }}
              />
              <p>{it[Auth.TITLE]()}</p>
            </div>)}
          </div>
        </>
      : <form
        key={type}
        className={submitted ? 'submitted' : void 0}
        onInvalid={() => setSubmitted(true)}
        onSubmit={e => {
          setSubmitted(true)
          e.preventDefault()
          setLoading(true)
          const data = { }
          new FormData(e.target as HTMLFormElement).forEach((v, k) => (data[k] = v))
          currentLogin
            .login(data)
            .then(key => __profilesModel().setSelectedProfile(key, currentLogin))
            .catch(console.error) // TODO:
            .finally(() => setLoading(false))
        }}>
          {(currentLogin[Auth.FIELDS] as Auth.Field[]).map(it => <React.Fragment key={it.name}>
            <label>{it.title()}</label>
            <div className='input2'>
              <input {...it.inputProps} name={it.name} />
              <div className='dot0' />
              <div className='dot1' />
              <div className='dot2' />
              <div className='dot3' />
            </div>
          </React.Fragment>)}
          <div className='links'>
            <span data-sound className='left' onClick={() => setType('')}>{$('Back')}</span>
            {currentLogin[Auth.LINK] &&
              <span data-sound className='right'
                onClick={() => shell.openExternal(currentLogin[Auth.LINK].url())}>
                {currentLogin[Auth.LINK].name()}
              </span>
            }
          </div>
          <button type='submit' className='btn3' style={{ marginTop: 8, width: '100%' }}>{$('Log in')}</button>
        </form>
      }
  </Dialog>
}

export default LoginDialog
