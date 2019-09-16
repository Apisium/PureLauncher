import './home.less'
import Slider from 'react-slick'
import React, { useEffect, useState } from 'react'
import { shell } from 'electron'

const Home: React.FC = () => {
  const [slides, setSlides] = useState<Array<{ text: string, url: string, img: string }>>([])
  const [news, setNews] = useState<Array<{ title: string, classify: string, link: string, time: string }>>([])
  useEffect(() => {
    fetch('https://www.mcbbs.net/forum.php')
      .then(it => it.text())
      .then(it => {
        const arr = Array.from(new DOMParser()
          .parseFromString(it, 'text/html')
          .getElementsByClassName('slideshow')[0]
          .children).map(({ childNodes: [a, span] }) => ({
            text: (span as HTMLSpanElement).innerText,
            url: 'http://www.mcbbs.net/' + (a as HTMLAnchorElement).getAttribute('href'),
            img: (a.childNodes[0] as HTMLImageElement).getAttribute('src')
          }))
        Promise.all(arr.map(i => new Promise(resolve => {
          const img = new Image()
          img.onload = img.onerror = resolve
          img.src = i.img
        }))).then(() => setSlides(arr))
      })
      .catch(console.error)
    fetch('https://authentication.x-speed.cc/mcbbsNews/')
      .then(it => it.json())
      .then(it => setNews(it.slice(0, 6)))
      .catch(console.error)
  }, [])
  return (
    <div className='home'>
      <div className='slider' style={{ opacity: slides.length ? 1 : 0 }}>
        <Slider fade infinite autoplay pauseOnHover autoplaySpeed={5000} slidesToShow={1} slidesToScroll={1}>
          {slides.map(it => <div className='cover' key={it.url} onClick={() => shell.openExternal(it.url)}>
            <img src={it.img} /><span>{it.text}</span></div>)}
        </Slider>
      </div>
      <div className='news' style={{ opacity: news.length ? 1 : 0 }}>{news.map(it => <p key={it.link}>
        <span className='classify'>{it.classify}</span>
        <a onClick={() => shell.openExternal(it.link)}> {it.title} </a>
      </p>)}</div>
    </div>
  )
}

export default Home
