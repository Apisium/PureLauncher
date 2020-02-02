import './list.less'
import fs from 'fs-extra'
import pAll from 'p-all'
import Empty from '../../components/Empty'
import Loading from '../../components/Loading'
import ProfilesStore, { Version } from '../../models/ProfilesStore'
import React, { Suspense, useState } from 'react'
import { ResourceMod, ResourceVersion, isMod } from '../../protocol/types'
import { join, basename } from 'path'
import { useParams } from 'react-router-dom'
import { createResource, OneCache } from 'react-cache-enhance'
import { useStore } from 'reqwq'
import { uninstallMod } from '../../protocol/uninstaller'
import { VERSIONS_PATH, RESOURCES_VERSIONS_PATH, RESOURCES_MODS_INDEX_FILE_NAME,
  RESOURCES_VERSIONS_INDEX_PATH } from '../../constants'

interface Ret { installed: ResourceMod[], mods: string[], unUninstallable: ResourceMod[] }

const cache = new OneCache()

const NIL: Ret = { installed: [], mods: [], unUninstallable: [] }
const useVersion = createResource(async (ver: string): Promise<Ret> => {
  if (!ver) return NIL
  try {
    ver = await profilesStore.resolveVersion(ver)
    const path = join(VERSIONS_PATH, ver, 'mods')
    let files = (await fs.readdir(path)).filter(it => it.endsWith('.jar'))
    const stats = await pAll(files.map(it => () => fs.stat(it)), { concurrency: 10 })
    files = files.filter((_, i) => stats[i].isFile())
    const json: Record<string, ResourceMod> = await fs.readJson(join(RESOURCES_VERSIONS_PATH, ver,
      RESOURCES_MODS_INDEX_FILE_NAME), { throws: false }) || { }
    const hashes = new Set<string>()
    const installed = Object.values(json)
    installed.forEach(it => it?.hashes?.forEach(h => hashes.add(h)))
    let unUninstallable: ResourceMod[]
    const verJson: ResourceVersion = (await fs.readJson(RESOURCES_VERSIONS_INDEX_PATH, { throws: false }) || {})[ver]
    if (verJson && verJson.resources) {
      unUninstallable = Object.values(verJson.resources).filter(isMod)
      unUninstallable.forEach(it => Array.isArray(it.hashes) && it.hashes.forEach(h => hashes.add(h)))
    }
    return { installed, unUninstallable, mods: files.filter(it => !hashes.has(basename(it, '.jar'))) }
  } catch { }
  return NIL
}, cache as any)

const Version: React.FC<{ version: string }> = p => {
  const [loading, setLoading] = useState(false)
  const requestUninstall = (id: string, d?: boolean) => !loading && openConfirmDialog({
    cancelButton: true,
    title: $('Warning!'),
    text: $('Are you sure to delete this mod? This is a dangerous operation and cannot be recovered after deletion!')
  }).then(ok => {
    if (ok) {
      setLoading(true)
      notice({ content: $('Deleting...') })
      uninstallMod(p.version, id, d).then(() => notice({ content: $('Success!') })).catch(e => {
        console.error(e)
        notice({ content: $('Failed!'), error: true })
      }).finally(() => {
        cache.delete(cache.key)
        setLoading(false)
      })
    }
  })
  const ver = useVersion(p.version)
  return ver.mods.length + ver.installed.length ? <ul className='scrollable'>
    {ver.installed.map(it => <li key={it.id}>
      {it.title ? <>{it.title} <span>({it.id})</span></> : it.id}
      <div className='time'>{it.description}</div>
      <div className='buttons'>
        <button
          className='btn2' onClick={() => 0}
        >
          {$('Export')}
        </button>
        <button className='btn2 danger' onClick={() => requestUninstall(it.id)}>{$('Delete')}</button>
      </div>
    </li>)}
    {ver.mods.map(it => <li key={it}>
      {it}
      <div className='buttons'>
        <button className='btn2 danger' onClick={() => requestUninstall(it, true)}>{$('Delete')}</button>
      </div>
    </li>)}
    {ver.unUninstallable.map(it => <li key={it.id}>
      {it.title ? <>{it.title} <span>({it.id})</span></> : it.id}
      <div className='time'>{it.description}</div>
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
