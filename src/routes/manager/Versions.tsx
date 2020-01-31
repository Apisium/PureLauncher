/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import './list.less'
import React, { useState, useMemo, useRef } from 'react'
import IconPicker, { resolveIcon } from '../../components/IconPicker'
import ProfilesStore, { Version } from '../../models/ProfilesStore'
import fs from 'fs-extra'
import moment from 'moment'
import Dialog from 'rc-dialog'
import ToolTip from 'rc-tooltip'
import history from '../../utils/history'
import Empty from '../../components/Empty'
import analytics from '../../utils/analytics'
import Loading from '../../components/Loading'
import { join } from 'path'
import { useStore } from 'reqwq'

const VersionEdit: React.FC<{ version: string, onClose: () => void }> = p => {
  const ref = useRef<HTMLFormElement>()
  const [open, setOpen] = useState(false)
  const [icon, setIcon] = useState('')
  const ps = useStore(ProfilesStore)
  const ver: Version = ps.profiles[p.version] || { } as any
  useMemo(() => setIcon(ver.icon), [p.version])
  return <Dialog
    animation='zoom'
    maskAnimation='fade'
    className='version-edit scrollable-dialog'
    onClose={p.onClose}
    visible={!!p.version}
    title={ver.lastVersionId}
    footer={[
      <button
        key='save'
        className='btn btn-primary'
        onClick={() => {
          p.onClose()
          if (!ref.current) return
          const data = new FormData(ref.current)
          analytics.event('profile', 'edit')
          profilesStore.editProfile(p.version, data.get('name') as string, data.get('icon') as string)
            .then(() => notice({ content: $('Success!') }))
            .catch(e => (console.error(e), notice({ content: $('Failed!'), error: true })))
        }}
      >{$('SAVE')}</button>,
      <button key='cancel' className='btn btn-secondary' onClick={p.onClose}>{$('CANCEL')}</button>,
      <button key='delete' className='btn btn-danger'>{$('Delete')}</button>
    ]}
  >
    <form className='pl-form' ref={ref}>
      <ToolTip placement='right' overlay={$('Click to edit')} overlayStyle={{ zIndex: 1100 }}>
        <img alt={ver.icon} src={resolveIcon(ver.icon)} className='version-icon' onClick={() => setOpen(true)} />
      </ToolTip>
      <input name='icon' value={icon || ''} type='hidden' />
      <div className='group'>
        <label>{$('NAME')}</label>
        <input name='name' defaultValue={ver.name} placeholder={$('Unnamed')} />
      </div>
    </form>
    <IconPicker onClose={it => (setIcon(it), setOpen(false))} open={open} />
  </Dialog>
}

const VERSIONS = join(profilesStore.root, 'versions')
const VersionAdd: React.FC<{ open: boolean, onClose: () => void }> = p => {
  const ref = useRef<HTMLFormElement>()
  const [open, setOpen] = useState(false)
  const [icon, setIcon] = useState('Furnace')
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(false)
  useMemo(() => {
    if (!p.open) return
    setIcon('Furnace')
    ;(async () => {
      setLoading(true)
      const set = new Set()
      Object.values(profilesStore.profiles).forEach(it => set.add(it.lastVersionId))
      const ret = (await fs.readdir(VERSIONS).catch(() => [] as string[])).filter(it => !set.has(it))
      const exists = await Promise.all(ret.map(it => fs.pathExists(join(VERSIONS, it, it + '.json'))))
      setVersions(ret.filter((_, i) => exists[i]))
      setLoading(false)
    })()
  }, [p.open])
  return <Dialog
    animation='zoom'
    maskAnimation='fade'
    className='version-edit scrollable-dialog'
    onClose={p.onClose}
    visible={p.open}
    title={$('Add Version')}
    footer={[
      <button
        key='save'
        disabled={loading}
        className='btn btn-primary'
        onClick={() => {
          p.onClose()
          if (!ref.current) return
          const data = new FormData(ref.current)
          analytics.event('profile', 'add')
          profilesStore.addProfile(
            data.get('version') as string,
            data.get('name') as string,
            data.get('icon') as string
          ).then(() => notice({ content: $('Success!') }))
            .catch(e => (console.error(e), notice({ content: $('Failed!'), error: true })))
        }}>{$('ADD')}</button>,
      <button key='cancel' className='btn btn-secondary' onClick={p.onClose}>{$('CANCEL')}</button>
    ]}
  >
    {loading ? <div style={{ flex: 1, display: 'flex' }}><Loading /></div>
      : <form className='pl-form' ref={ref}>
        <ToolTip placement='right' overlay={$('Click to edit')} overlayStyle={{ zIndex: 1100 }}>
          <img alt={icon} src={resolveIcon(icon)} className='version-icon' onClick={() => setOpen(true)} />
        </ToolTip>
        <input name='icon' value={icon} type='hidden' />
        <div className='group'>
          <label>{$('NAME')}</label>
          <input name='name' placeholder={$('Unnamed')} />
        </div>
        <div className='group'>
          <label>{$('VERSION')}</label>
          <select name='version'>{versions.map(it => <option value={it} key={it}>{it}</option>)}</select>
        </div>
        <a role='link'>{$('Install the vanilla game / Forge / Fabric?')}</a>
      </form>}
    <IconPicker onClose={it => (setIcon(it), setOpen(false))} open={open} />
  </Dialog>
}

const Versions: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [currentVersion, setCurrentVersion] = useState('')
  const pm = useStore(ProfilesStore)
  const noTitle = $('No Title')
  const unknown = $('Unnamed')
  const lastPlayed = $('Last played')
  const lastRelease = $('last-release')
  const lastSnapshot = $('last-snapshot')
  const clickToEdit = $('Click to edit')
  const versions = Object
    .entries(pm.profiles)
    .filter(([_, ver]) => ver.type !== 'latest-snapshot' || pm.settings.enableSnapshots)
  return <div className='manager-list version-switch manager-versions'>
    <div className='list-top'>
      <span className='header'>{$('Versions List')}</span>
      <a className='add-btn' role='button' onClick={() => setOpen(true)}>
        <i data-sound className='iconfont icon-shuliang-zengjia_o' />
        <span data-sound>{$('Add new...')}</span>
      </a>
    </div>
    {versions.length ? <ul className='scrollable'>
      {versions
        .map(([key, ver]) => ({ ...ver, key, lastUsed: moment(ver.lastUsed) }))
        .sort((a, b) => b.lastUsed.valueOf() - a.lastUsed.valueOf())
        .map(ver => <ToolTip key={ver.key} placement='left' overlay={clickToEdit} destroyTooltipOnHide>
          <li onClick={() => setCurrentVersion(ver.key)} className='version'>
            <img src={resolveIcon(ver.icon)} alt={ver.icon} className='version-icon' />
            <div>
              {ver.type === 'latest-release' ? lastRelease
                : ver.type === 'latest-snapshot' ? lastSnapshot : ver.name || noTitle}
              <span>({ver.lastVersionId})</span>
              <div className='time'>{lastPlayed}: {ver.lastUsed.valueOf() ? ver.lastUsed.fromNow() : unknown}</div>
            </div>
            <div className='buttons'>
              <button
                className='btn2'
                onClick={e => {
                  e.stopPropagation()
                  history.push('/manager/mods/' + ver.key)
                }}
              >{$('Mods')}</button>
              <button className='btn2 default' onClick={e => e.stopPropagation()}>{$('Export')}</button>
            </div>
          </li>
        </ToolTip>)}
    </ul> : <Empty />}
    <VersionEdit version={currentVersion} onClose={() => setCurrentVersion('')} />
    <VersionAdd open={open} onClose={() => setOpen(false)} />
  </div>
}

export default Versions
