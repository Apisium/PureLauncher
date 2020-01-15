/* eslint-disable react/jsx-first-prop-new-line */
import './home.less'
import Slider from 'react-slick'
import user from '../utils/analytics'
import React, { useEffect, useState } from 'react'
import { shell } from 'electron'

const openUrl = (url: string) => {
  shell.openExternal(url)
  user.event('external url', 'open').catch(console.error)
}
const Home: React.FC = () => {
  const [slides, setSlides] = useState<Array<{ text: string, url: string, img: string }>>([])
  const [news, setNews] = useState<Array<{ title: string, classify: string, link: string, time: string }>>([])
  useEffect(() => {
    let time = +localStorage.getItem('slidesTime') || 0
    let promise = Promise.resolve()
    if (Date.now() - time > 12 * 60 * 60 * 1000) {
      localStorage.removeItem('slides')
      promise = fetch('https://www.mcbbs.net/forum.php')
        .then(it => it.text())
        .then(it => {
          localStorage.setItem('slides', JSON.stringify(Array.from(new DOMParser()
            .parseFromString(it, 'text/html')
            .getElementsByClassName('slideshow')[0]
            .children
          )
            .map(({ childNodes: n }) => ({
              text: (n[1] as HTMLSpanElement).innerText,
              url: (n[0] as HTMLAnchorElement).getAttribute('href'),
              img: (n[0].childNodes[0] as HTMLImageElement).getAttribute('src')
            }))))
          localStorage.setItem('slidesTime', Date.now().toString())
        })
        .catch(console.error)
    }
    promise.then(() => {
      const v = localStorage.getItem('slides')
      if (!v) return
      const arr = JSON.parse(v)
      Promise.all(arr.map(i => new Promise(resolve => {
        const img = new Image()
        img.onload = img.onerror = resolve
        img.src = i.img
      }))).then(() => setSlides(arr))
    })

    time = +localStorage.getItem('newsTime') || 0
    promise = Promise.resolve()
    if (Date.now() - time > 12 * 60 * 60 * 1000) {
      localStorage.removeItem('news')
      promise = fetch('https://authentication.x-speed.cc/mcbbsNews/')
        .then(it => it.json())
        .then(it => {
          localStorage.setItem('news', JSON.stringify(it.slice(0, 6)))
          localStorage.setItem('newsTime', Date.now().toString())
        })
        .catch(console.error)
    }
    promise.then(() => {
      const v = localStorage.getItem('news')
      if (v) setNews(JSON.parse(v))
    })
  }, [])
  return (
    <div className='home'>
      <div className='slider' style={{ opacity: slides.length ? 1 : 0 }}>
        <Slider key={slides} fade infinite autoplay pauseOnHover
          autoplaySpeed={5000} slidesToShow={1} slidesToScroll={1}>
          {slides.map(it => <div className='cover' key={it.url} role='button' onClick={() => openUrl(it.url)}>
            <img src={it.img} alt={it.text} /><span>{it.text}</span>
          </div>)}
        </Slider>
      </div>
      <div className='news' style={{ opacity: news.length ? null : 0 }}>{news.map(it => <p key={it.link}>
        <span className='classify'>{it.classify}</span>
        <a role='button' onClick={() => openUrl(it.link)}> {it.title} </a>
      </p>)}
      </div>
    </div>
  )
}

export default Home
