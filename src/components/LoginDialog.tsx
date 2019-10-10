import './login-dialog.less'
import React, { useState } from 'react'
import Dialog from 'rc-dialog'
import { shell } from 'electron'

const buy = () => shell.openExternal('https://my.minecraft.net/store/minecraft/#register')
const steve = { backgroundImage: `url(${require('../assets/images/steve.png')})` }
const zombie = { backgroundImage: `url(${require('../assets/images/zombie.png')})` }

const LoginDialog: React.FC = () => {
  const [type, setType] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const back = () => setType(0)
  return <Dialog className='login-dialog'>
    {type === 0
      ? <>
          <p className='title'>{$('Choose your account login mode. If you don\'t have the online version, please choose the "Offline Login" on the right')}</p>
          <div className='heads'>
            <div><div className='head' style={steve} data-sound onClick={() => setType(1)} />
              <p>{$('Online Login')}</p></div>
            <div><div className='head' style={zombie} data-sound onClick={() => setType(2)} />
              <p>{$('Offline Login')}</p></div>
          </div>
        </>
      : type === 1
        ? <form className={submitted ? 'submitted' : void 0} onSubmit={e => {
          setSubmitted(true)
          e.preventDefault()
        }} onInvalid={() => setSubmitted(true)}>
            <label>{$('Email')}</label>
            <div className='input2'>
              <input required type='email' name='email' />
              <div className='dot0' />
              <div className='dot1' />
              <div className='dot2' />
              <div className='dot3' />
            </div>
            <label>{$('Password')}</label>
            <div className='input2'>
              <input required type='password' name='password' />
              <div className='dot0' />
              <div className='dot1' />
              <div className='dot2' />
              <div className='dot3' />
            </div>
            <div className='links'>
              <span data-sound className='left' onClick={back}>{$('Back')}</span>
              <span data-sound className='right' onClick={buy}>{$('Register')}</span>
            </div>
            <button type='submit' className='btn3' style={{ marginTop: 8, width: '100%' }}>{$('Login')}</button>
          </form>
        : type === 2
          ? <form className={submitted ? 'submitted' : void 0} onSubmit={e => {
            setSubmitted(true)
            e.preventDefault()
          }} onInvalid={() => setSubmitted(true)}>
            <label>{$('Username')}</label>
            <div className='input2'>
              <input required pattern='\w{2,16}' name='username' />
              <div className='dot0' />
              <div className='dot1' />
              <div className='dot2' />
              <div className='dot3' />
            </div>
            <div className='links'>
              <span data-sound className='left' onClick={back}>{$('Back')}</span>
            </div>
            <button type='submit' className='btn3' style={{ marginTop: 8, width: '100%' }}>{$('Login')}</button>
          </form>
        : null}
  </Dialog>
}

export default LoginDialog
