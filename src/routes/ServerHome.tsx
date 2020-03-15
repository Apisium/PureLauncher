import './server-home.less'
import React, { Suspense, useMemo } from 'react'
import Img from 'react-image'
import Loading from '../components/Loading'
import { AnimatePresence, motion } from 'framer-motion'
import { parse } from 'querystring'
import { useLocation } from 'react-router-dom'
import { queryStatus } from '@xmcl/client/status'
import { createResource, OneCache } from 'react-cache-enhance'
import { fromFormattedString, render } from '@xmcl/text-component/index'

const Div = motion.div as any

const LOGO = require('../assets/images/unknown_server.png')

const cache = new OneCache()

interface Ret {
  description: string
  max: number
  online: number
  logo: string
  ping: number
}

const useStatus = createResource(async (host: string, port?: string) => {
  if (host) {
    const obj: any = { host }
    if (port) {
      const p = parseInt(port)
      if (!isNaN(p) && p > 0 && p < 65536) obj.port = p
    }
    const data = await queryStatus(obj, { timeout: 10000 }).catch(console.error)
    // console.log(data, obj)
    return data ? {
      description: typeof data.description === 'string' ? data.description : data.description?.text || '',
      max: data.players?.max || 0,
      online: data.players?.online || 0,
      logo: data.favicon,
      ping: data.ping
    } as Ret : null
  } else return null
}, cache as any)

interface Query { host?: string, port?: string, name?: string, description?: string, logo?: string }
const Context: React.FC = () => {
  const args: Query = parse(useLocation().search.replace(/^\?/, ''))
  if (!args.name) return null
  const status = (args.host && useStatus(args.host, args.port)) || ({ } as any as Ret)
  const desc = (args.description || status.description || '').toString()
  // console.log(status)
  return <Div
    key={LOGO}
    className='container'
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <Img
      src={status.logo || LOGO}
      loader={<img src={LOGO} alt='logo' />}
      unloader={<img src={LOGO} alt='logo' />}
    />
    <h1>{args.name}</h1>
    {status.online && status.max && <p>在线人数: {status.online}/{status.max}</p>}
    {useMemo(() => {
      if (!desc) return
      const p = render(fromFormattedString(desc))
      return <p className='desc' key={desc} style={p.style}>{p.component.text}{p.children?.map((it, i) =>
        <span key={i} style={it.style}>{it.component.text}</span>)}</p>
    }, [desc])}
  </Div>
}

const ServerHome: React.FC = () => {
  return <div className='server-home'>
    <AnimatePresence exitBeforeEnter>
      <Suspense fallback={<Div
        key={LOGO}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ flex: 1, display: 'flex' }}
      ><Loading /></Div>}>
        <Context />
      </Suspense>
    </AnimatePresence>
  </div>
}

export default ServerHome
