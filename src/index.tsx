import './index.css'
import './utils/isDev'
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import Notification from 'rc-notification'
import './protocol/index'
import { remote } from 'electron'

const main = document.getElementsByTagName('main')[0]
const top = document.getElementById('top')
const logo = document.getElementById('top-logo')
const chicken = document.getElementById('chicken')
const chickenSound = new Audio(require('./assets/sounds/chicken.ogg'))
ReactDOM.render(<App />, document.getElementById('root'), () => {
  const content = document.getElementById('main-content')
  let full = true
  let instance: any
  Notification.newInstance({ getContainer: () => content }, it => (instance = it))
  window.notice = (ctx: { content: React.ReactNode, duration?: number, error?: boolean }) => {
    if (!ctx.duration) ctx.duration = 5
    const ac = ctx as any
    ac.style = { }
    if (ctx.error) {
      ac.style.backgroundColor = '#d4441a'
      ac.style.color = '#fff'
      if (typeof ctx.content === 'string') ctx.content = $('Error:') + ' ' + ctx.content
    }
    instance.notice(ctx)
  }
  chicken.onclick = () => {
    try { chickenSound.play().catch(() => {}) } catch (e) { }
    if (full) {
      full = false
      chicken.style.opacity = '0'
      content.style.opacity = '0'
      topBar.containers[2].style.opacity = '0'
      logo.style.opacity = '0'
      setTimeout(() => {
        top.style.width = '220px'
        main.style.width = '180px'
        topBar.containers[0].style.width = '220px'
        topBar.containers[1].style.width = '180px'
      }, 700)
      setTimeout(() => {
        remote.getCurrentWindow().setSize(240, 586)
        setTimeout(() => (chicken.style.opacity = '1'), 100)
      }, 4000)
    } else {
      full = true
      chicken.style.opacity = '0'
      setTimeout(() => {
        remote.getCurrentWindow().setSize(816, 586)
        top.style.width = ''
        topBar.containers[2].style.display = ''
        main.style.width = ''
        topBar.containers[0].style.width = ''
        topBar.containers[1].style.width = ''
        setTimeout(() => {
          topBar.containers[2].style.opacity = '1'
          content.style.opacity = '1'
          logo.style.opacity = '1'
        }, 3000)
        setTimeout(() => (chicken.style.opacity = '1'), 4000)
      }, 1000)
    }
  }
})

const clickSound = new Audio(require('./assets/sounds/click.ogg'))
clickSound.oncanplay = () => document.addEventListener('click', e => {
  const t = e.target as HTMLElement
  if (t.tagName === 'BUTTON' || t.tagName === 'A' || t.dataset.sound) {
    clickSound.play().catch(() => {})
  }
})

document.getElementById('close').onclick = () => setTimeout(() => remote.app.quit(), 500)
document.getElementById('hide').onclick = () => remote.getCurrentWindow().minimize()

/* eslint-disable @typescript-eslint/no-unused-vars */
let timer1: NodeJS.Timeout
let timer2: NodeJS.Timeout
function startAnimation () {
  chicken.style.opacity = '1'
  timer1 = setInterval(() => {
    topBar.blocks[0][Math.random() * topBar.blocks[0].length | 0]
      .style.backgroundColor = topBar.colors[0][Math.random() * topBar.colors[0].length | 0]
    topBar.blocks[1][Math.random() * topBar.blocks[1].length | 0]
      .style.backgroundColor = topBar.colors[1][Math.random() * topBar.colors[1].length | 0]
    topBar.blocks[2][Math.random() * topBar.blocks[2].length | 0]
      .style.backgroundColor = topBar.colors[2][Math.random() * topBar.colors[2].length | 0]
  }, 100)
  timer2 = setInterval(() => (chicken.style.marginTop = 10 - (Math.random() * 20 | 0) + 'px'), 1000)
}
function stopAnimation () {
  chicken.style.opacity = '2'
  clearInterval(timer1)
  clearInterval(timer2)
}
