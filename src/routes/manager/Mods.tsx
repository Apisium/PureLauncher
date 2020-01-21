import './list.less'
import fs from 'fs-extra'
import pAll from 'p-all'
import Empty from '../../components/Empty'
import Loading from '../../components/Loading'
import ProfilesStore, { Version } from '../../models/ProfilesStore'
import React, { Suspense } from 'react'
import { getModsIndexPath } from '../../plugin/internal/ResourceInstaller'
import { ResourceMod } from '../../protocol/types'
import { join, basename } from 'path'
import { useParams } from 'react-router-dom'
import { createResource, OneCache } from 'react-cache-enhance'
import { useStore } from 'reqwq'

const NIL = { installed: [], mods: [] }
const useVersion = createResource(async (ver: string) => {
  if (!ver) return NIL
  try {
    ver = await profilesStore.resolveVersion(ver)
    const path = join(profilesStore.root, 'versions', ver, 'mods')
    let files = (await fs.readdir(path)).filter(it => it.endsWith('.jar'))
    const stats = await pAll(files.map(it => () => fs.stat(it)), { concurrency: 10 })
    files = files.filter((_, i) => stats[i].isFile())
    const json: Record<string, ResourceMod> = await fs.readJson(getModsIndexPath(ver), { throws: false }) || { }
    const hashes = new Set<string>()
    Object.values(json).forEach(it => it?.hashes?.forEach(h => hashes.add(h)))
    const installed: ResourceMod[] = []
    return { installed, mods: files.filter(it => !hashes.has(basename(it, '.jar'))) }
  } catch { }
  return NIL
}, new OneCache() as any)

const Version: React.FC<{ version: string }> = p => {
  const ver = useVersion(p.version)
  return ver.mods.length + ver.installed.length ? <ul className='scrollable'>
    {ver.mods.map(it => <li key={it}>
      {it}
      <div className='time'>233</div>
      <div className='buttons'>
        <button
          className='btn2' onClick={() => 0}
        >
          {$('Use')}
        </button>
        <button
          className='btn2 danger' onClick={() => { }}
        >
          {$('Log out')}
        </button>
      </div>
    </li>)}
    {ver.installed.map(it => <li key={it.id}>
      {it.title ? <>{it.title} <span>({it.id})</span></> : it.id}
      <div className='time'>{it.description}</div>
      <div className='buttons'>
        <button
          className='btn2' onClick={() => 0}
        >
          {$('Export')}
        </button>
        <button
          className='btn2 danger' onClick={() => { }}
        >
          {$('Disable')}
        </button>
        <button
          className='btn2 danger' onClick={() => { }}
        >
          {$('Delete')}
        </button>
      </div>
    </li>)}
  </ul> : <Empty />
}

const Mods: React.FC = () => {
  const { version } = useParams<{ version: string }>()
  const ps = useStore(ProfilesStore)
  const profile: Version = ps.profiles[version] || { } as any
  return <div className='manager-list version-switch manager-versions'>
    <div className='list-top'>
      <span className='header no-button'>{$('Mods')} - {profile.name || $('Unknown')} ({profile.lastVersionId})</span>
    </div>
    <Suspense fallback={<div style={{ flex: 1, display: 'flex' }}><Loading /></div>}>
      <Version version={version} />
    </Suspense>
  </div>
}

export default Mods
