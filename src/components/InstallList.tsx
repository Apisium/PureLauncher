import './install-list.less'
import React, { useState, useMemo, useEffect, useRef } from 'react'
import Dialog from 'rc-dialog'
import { Treebeard } from 'react-treebeard'
import { ResourceVersion, Resource, ResourceMod, ResourceServer } from '../protocol/types'

const styles = {
  tree: {
    base: {
      color: '#444',
      backgroundColor: undefined
    },
    node: {
      activeLink: { backgroundColor: undefined },
      toggle: {
        base: {
          position: 'relative',
          display: 'inline-block',
          verticalAlign: 'top',
          marginLeft: -5,
          height: 24,
          width: 24
        },
        wrapper: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          margin: '-7px 0 0 -7px',
          height: 14
        },
        height: 14,
        width: 14,
        arrow: {
          fill: '#777',
          strokeWidth: 0,
          transform: 'scale(0.7)'
        }
      },
      header: { base: {
        color: '#444',
        display: 'inline-block',
        verticalAlign: 'top'
      } }
    }
  }
}

let _setRes: any
let resolve: any
let reject: any
global.__requestInstallResources = (d: any) => {
  if (reject) reject()
  _setRes(d)
  return new Promise(a => {
    resolve = () => {
      a(true)
      _setRes(null)
      resolve = reject = null
    }
    reject = () => {
      a(false)
      _setRes(null)
      resolve = reject = null
    }
  })
}

const InstallList: React.FC = () => {
  const [res, setRes] = useState<Resource>(null)
  _setRes = setRes
  const [data, setData] = useState({})
  useMemo(() => {
    if (res && res.type === 'Version') {
      const mods = []
      const servers = []
      const resources = []
      const plugins = []
      ;(res as ResourceVersion).resources.forEach(it => {
        switch (it.type) {
          case 'Mod':
            mods.push({ id: it.id, name: `${it.title || it.id}@${it.version}` })
            break
          case 'Server':
            servers.push({ id: it.ip, name: it.title || (it.port ? `${it.ip}:${it.port}` : it.ip) })
            break
          case 'ResourcesPack':
            resources.push({ id: it.id, name: `${it.title || it.id}@${it.version}` })
            break
          case 'Plugin':
            plugins.push({ id: it.id, name: `${it.title || it.id}@${it.version}` })
            break
        }
      })
      const d = {
        id: 'root',
        name: $('Detailed List'),
        toggled: true,
        children: []
      }
      if (mods.length) d.children.push({ id: 'mods', name: $('Mods'), children: mods })
      if (servers.length) d.children.push({ id: 'servers', name: $('Servers'), children: servers })
      if (resources.length) d.children.push({ id: 'resources', name: $('Resources'), children: resources })
      if (plugins.length) d.children.push({ id: 'plugins', name: $('Plugins'), children: resources })
      setData(d)
    } else setData(res)
  }, [res])

  const [cursor, setCursor] = useState<any>(null)

  if (!res) return <Dialog className='install-list' animation='zoom' maskAnimation='fade' />

  let name: string
  let comp: any
  switch (res.type) {
    case 'Version':
      name = $('Version')
      comp = <div className='list'><Treebeard style={styles} data={data} onToggle={(node: any, toggled: any) => {
        if (cursor) cursor.active = false
        node.active = true
        if (node.children) node.toggled = toggled
        setCursor(node)
        setData(Object.assign({}, data))
      }} /></div>
      break
    case 'Mod': {
      name = $('Mods')
      const r = res as ResourceMod
      comp = <>
        {r.mcVersion && <p><span>{$('Minecraft Version')}: </span>{r.mcVersion}</p>}
        {r.apis && <p><span>{$('Apis')}: </span>{Object.keys(r.apis).join(', ')}</p>}
      </>
      break
    }
    case 'ResourcesPack':
      name = $('Resources')
      break
    case 'Server': {
      name = $('Servers')
      const r = res as ResourceServer
      comp = <p><span>{$('Host')}: </span>{r.ip}{r.port ? ':' + r.port : null}</p>
      break
    }
    case 'Plugin':
      name = $('Plugins')
      break
  }
  return <Dialog
    animation='zoom'
    maskAnimation='fade'
    title={$('Install') + '-' + name}
    className='install-list'
    onClose={reject}
    visible
  >
    <p><span>{$('Name')}: </span>{res.title || res.id}</p>
    {(res as any).version && <p><span>{$('VersionId')}: </span>{(res as any).version}</p>}
    {res.author && <p><span>{$('Author')}: </span>{res.author}</p>}
    {res.description && <p><span>{$('Description')}: </span>{res.description}</p>}
    {comp}
    <div className='buttons'>
      <button className='btn btn-primary' onClick={resolve}>{$('INSTALL')}</button>
      <button className='btn btn-secondary' onClick={reject}>{$('CANCEL')}</button>
    </div>
  </Dialog>
}

export default InstallList
