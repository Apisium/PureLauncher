import './login-dialog.less'
import React, { useState, Dispatch, SetStateAction } from 'react'
import Dialog from 'rc-dialog'
import { shell } from 'electron'
import { Link } from 'react-router-dom'
import * as Auth from '../plugin/Authenticator'

const getObjectLength = (obj: any) => {
  let i = 0
  /* eslint-disable @typescript-eslint/no-unused-vars */
  for (const _ in obj) i++
  return i
}

let fn: (type: string) => void
let onClose2: () => void
let defaults: Record<string, string> | void
let openFn: [boolean, Dispatch<SetStateAction<boolean>>]
export const openLoginDialog = (type: string, defaultValues?: Record<string, string>, onClose?: () => void) => {
  if (!type) return
  onClose2 = onClose
  defaults = defaultValues
  if (type) fn(type)
  if (openFn) openFn[1](true)
}

/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
const LoginDialog: React.FC<{ open: boolean, onClose: () => void }> = props => {
  const [type, setType] = useState('')
  openFn = useState(false)
  fn = setType
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const currentLogin = pluginMaster.logins[type]
  let width: number
  if (!type) {
    const len = getObjectLength(pluginMaster.logins)
    width = len > 3 ? 570 / len - 30 : 130
  }
  const close = () => {
    props.onClose()
    openFn[1](false)
    setType('')
    if (onClose2) onClose2()
    fn = onClose2 = defaults = null
  }
  const Component: React.ComponentType = currentLogin?.[Auth.COMPONENT]
  return <Dialog
    animation='zoom'
    maskAnimation='fade'
    className='login-dialog'
    visible={props.open || openFn[0]}
    onClose={() => !loading && close()}
  >
    {type === ''
      ? <>
        <p className='title'>{$('Choose your account login mode. If you don\'t have the online version, please choose the "Offline Login" on the right')}</p>
        <Link to='/manager/accounts' className='title title2' onClick={close}>
          {$('Have already logged in? Click here!')}
        </Link>
        <div className='heads'>
          {Object.values(pluginMaster.logins).map(it => <div key={it[Auth.NAME]}>
            <div
              data-sound
              role='img'
              className='head'
              onClick={() => {
                setSubmitted(false)
                setType(it[Auth.NAME])
              }}
              style={{ backgroundImage: `url(${it[Auth.LOGO]})`, width, height: width }}
            />
            <p>{it[Auth.TITLE](it)}</p>
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
              close()
            })
            .catch(err => notice({ content: err.message, error: true })) // TODO:
            .finally(() => setLoading(false))
        }}
      >
        {(currentLogin[Auth.FIELDS] as Auth.Field[]).map(it => <React.Fragment key={it.name}>
          <label htmlFor={it.name}>{it.title()}</label>
          <div className={'input2 ' + (loading ? 'disabled' : '')}>
            <input {...it.inputProps} name={it.name} disabled={loading} id={it.name} defaultValue={defaults?.[it.name]} />
            <div className='dot0' />
            <div className='dot1' />
            <div className='dot2' />
            <div className='dot3' />
          </div>
        </React.Fragment>)}
        {Component && <Component />}
        <div className='links'>
          <span data-sound className='left' role='button' onClick={() => !loading && setType('')}>{$('Back')}</span>
          {currentLogin[Auth.LINK] &&
            <span
              data-sound className='right' role='button'
              onClick={() => shell.openExternal(currentLogin[Auth.LINK].url())}
            >
              {currentLogin[Auth.LINK].name()}
            </span>}
        </div>
        <button
          type='submit'
          className='btn3'
          disabled={loading}
          style={{ marginTop: 8, width: '100%' }}
        >{$(loading ? 'Loading...' : 'Log in')}
        </button>
      </form>}
  </Dialog>
}

export default LoginDialog
