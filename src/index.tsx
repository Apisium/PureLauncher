import './index.css'
import './utils/isDev'
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './protocol/index'
import { remote } from 'electron'
import { newInstance } from 'rc-notification'

const colors1 = ['7e512f', '8c6a48', '8b6428', '885b3c', '754b2e', 'c38a58', '775237', '775236',
  '905536', '675432', '735337', '754b2e', '975a35', '70472f', '8c6948', '5f4939', '7e512f',
  '8b6428', '675d46', '645634', '6f6449'].map(i => '#' + i)
const colors2 = ['9bbf56', '869f43', '7fad3a', '7ab53f', '7ab139', '7a993f', 'a5c95e', '87b43e'].map(i => '#' + i)
const colors3 = colors1.concat(colors2.slice(5))
// const colors1 = Array.from({ length: 20 }).map(() => `hsl(0, 0%, ${Math.random() * 20 | 0}%)`)
// const colors2 = colors1
// const colors3 = colors1

const blocks1 = document.getElementById('blocks1')
const count = window.innerWidth / 20 | 0
for (let i = 0; i < count; i++) {
  const elm = document.createElement('div')
  elm.style.backgroundColor = colors2[Math.random() * colors2.length | 0]
  blocks1.appendChild(elm)
}

const blocks2 = document.getElementById('blocks2')
for (let i = 2; i < count; i++) {
  const elm = document.createElement('div')
  elm.style.backgroundColor = colors3[Math.random() * colors3.length | 0]
  blocks2.appendChild(elm)
}

const blocks3 = document.getElementById('blocks3')
for (let i = 16; i < count; i++) {
  const elm = document.createElement('div')
  elm.style.backgroundColor = colors1[Math.random() * colors1.length | 0]
  blocks3.appendChild(elm)
}

const main = document.getElementsByTagName('main')[0]
const top = document.getElementById('top')
const logo = document.getElementById('top-logo')
const chicken = document.getElementById('chicken')
const chickenSound = new Audio(require('./assets/sounds/chicken.ogg'))
ReactDOM.render(<App />, document.getElementById('root'), () => {
  const content = document.getElementById('main-content')
  let full = true
  let instance: any
  newInstance({ getContainer: () => content }, it => (instance = it))
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
      blocks3.style.opacity = '0'
      logo.style.opacity = '0'
      setTimeout(() => {
        top.style.width = '220px'
        main.style.width = '180px'
        blocks1.style.width = '220px'
        blocks2.style.width = '180px'
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
        blocks3.style.display = ''
        main.style.width = ''
        blocks1.style.width = ''
        blocks2.style.width = ''
        setTimeout(() => {
          blocks3.style.opacity = '1'
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

var timer1: NodeJS.Timeout
var timer2: NodeJS.Timeout
function startAnimation () {
  chicken.style.opacity = '1'
  timer1 = setInterval(() => {
    (blocks1.childNodes[Math.random() * blocks1.childElementCount | 0] as HTMLDivElement)
      .style.backgroundColor = colors2[Math.random() * colors2.length | 0]
    ;(blocks2.childNodes[Math.random() * blocks2.childElementCount | 0] as HTMLDivElement)
      .style.backgroundColor = colors3[Math.random() * colors3.length | 0]
    ;(blocks3.childNodes[Math.random() * blocks3.childElementCount | 0] as HTMLDivElement)
      .style.backgroundColor = colors1[Math.random() * colors1.length | 0]
  }, 100)
  timer2 = setInterval(() => (chicken.style.marginTop = 10 - (Math.random() * 20 | 0) + 'px'), 1000)
}
function stopAnimation () {
  chicken.style.opacity = '2'
  clearInterval(timer1)
  clearInterval(timer2)
}
