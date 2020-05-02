/* eslint-disable react/jsx-first-prop-new-line */
import './home.less'
import Slider from 'react-slick'
import user from '../utils/analytics'
import Loading from '../components/Loading'
import React, { useEffect, useState } from 'react'
import { shell } from 'electron'
import { NEWS_URL } from '../constants'

interface News {
  slides: Array<{ url: string, title: string, img: string }>
  news: Array<{ time: string, title: string, classify: string, link: string }>
}

const NIL = { slides: [], news: [] }

const openUrl = (url: string) => {
  shell.openExternal(url)
  user.event('external url', 'open').catch(console.error)
}
const Home: React.FC = () => {
  const [data, setData] = useState<News>(NIL)
  const [loading, setLoading] = useState(false)
  const [fail, setFail] = useState(false)
  const load = () => {
    if (!navigator.onLine) {
      setFail(true)
      return
    }
    const time = +localStorage.getItem('newsTime') || 0
    let promise = Promise.resolve()
    if (Date.now() - time > 12 * 60 * 60 * 1000) {
      setLoading(true)
      localStorage.removeItem('news')
      promise = fetch(NEWS_URL)
        .then(it => it.text())
        .then(it => {
          localStorage.setItem('news', it)
          localStorage.setItem('newsTime', Date.now().toString())
        })
        .catch(console.error)
    }
    promise.then(() => {
      const v = localStorage.getItem('news')
      setLoading(false)
      if (v) setTimeout(setData, 100, JSON.parse(v))
      else setFail(true)
    })
  }
  useEffect(() => {
    load()
    document.addEventListener('online', load)
    return () => document.removeEventListener('online', load)
  }, [])
  return (
    <div className='home'>
      {loading ? <div style={{ marginTop: 160 }}><Loading /></div>
        : fail ? <div className='pl-empty error vh100' style={{ marginTop: 140 }}>
          <div className='container'>
            <i
              role='button'
              className='iconfont icon-minecraft'
              onClick={() => {
                if (navigator.onLine) {
                  setFail(false)
                  load()
                }
              }}
            />
            <p>{$('Network disconnected!\nPlease click the Creeper icon above to reload the page.')}</p>
          </div>
        </div>
          : <>
            <div className='slider' style={{ opacity: data.slides.length ? 1 : 0 }}>
              <Slider key={data.slides} fade infinite autoplay pauseOnHover
                autoplaySpeed={5000} slidesToShow={1} slidesToScroll={1}>
                {data.slides.map(it => <div className='cover' key={it.url} role='button' onClick={() => openUrl(it.url)}>
                  <img src={it.img} alt={it.title} /><span>{it.title}</span>
                </div>)}
              </Slider>
            </div>
            <div className='news' style={{ opacity: data.news.length ? null : 0 }}>{data.news.map(it => <p key={it.link}>
              <span className='classify'>[{it.classify}]</span>
              <a role='button' onClick={() => openUrl(it.link)}> {it.title} </a>
            </p>)}
            </div>
          </>}
    </div>
  )
}

export default Home
