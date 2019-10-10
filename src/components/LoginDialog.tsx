import './login-dialog.less'
import React, { useState, InvalidEvent } from 'react'
import Dialog from 'rc-dialog'

const steve = { backgroundImage: `url(${require('../assets/images/steve.png')})` }
const zombie = { backgroundImage: `url(${require('../assets/images/zombie.png')})` }

const LoginDialog: React.FC = () => {
  const [type, setType] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const back = () => setType(0)
  return <Dialog className='login-dialog'>
    {type === 0
      ? <>
          <p className='title'>选择您的帐号登录模式, 如果您还没有购买正版, 请您选择右侧的“离线登录”</p>
          <div className='heads'>
            <div><div className='head' style={steve} data-sound onClick={() => setType(1)} /><p>正版登录</p></div>
            <div><div className='head' style={zombie} data-sound onClick={() => setType(2)} /><p>离线登录</p></div>
          </div>
        </>
      : type === 1
        ? <form className={submitted ? 'submitted' : void 0} onSubmit={e => {
          setSubmitted(true)
          e.preventDefault()
        }} onInvalid={() => setSubmitted(true)}>
            <label>邮箱</label>
            <div className='input2'>
              <input required type='email' name='email' />
              <div className='dot0' />
              <div className='dot1' />
              <div className='dot2' />
              <div className='dot3' />
            </div>
            <label>密码</label>
            <div className='input2'>
              <input required type='password' name='password' />
              <div className='dot0' />
              <div className='dot1' />
              <div className='dot2' />
              <div className='dot3' />
            </div>
            <div className='links'>
              <span data-sound className='left' onClick={back}>返回</span>
              <span data-sound className='right'>购买正版</span>
            </div>
            <button type='submit' className='btn3' style={{ marginTop: 8, width: '100%' }}>登录</button>
          </form>
        : type === 2
          ? <form className={submitted ? 'submitted' : void 0} onSubmit={e => {
            setSubmitted(true)
            e.preventDefault()
          }} onInvalid={() => setSubmitted(true)}>
            <label>游戏名</label>
            <div className='input2'>
              <input required pattern='\w{2,16}' name='username' />
              <div className='dot0' />
              <div className='dot1' />
              <div className='dot2' />
              <div className='dot3' />
            </div>
            <div className='links'>
              <span data-sound className='left' onClick={back}>返回</span>
            </div>
            <button type='submit' className='btn3' style={{ marginTop: 8, width: '100%' }}>登录</button>
          </form>
        : null}
  </Dialog>
}

export default LoginDialog
