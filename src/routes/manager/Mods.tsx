import './list.less'
import fs from 'fs-extra'
import Empty from '../../components/Empty'
import Loading from '../../components/Loading'
import ProfilesStore, { Version } from '../../models/ProfilesStore'
import React, { Suspense, useState } from 'react'
import { clipboard } from 'electron'
import { ResourceMod, ResourceVersion, isMod } from '../../protocol/types'
import { join, basename } from 'path'
import { useParams } from 'react-router-dom'
import { createResource, OneCache } from 'react-cache-enhance'
import { useStore } from 'reqwq'
import { exportResource, exportUnidentified } from '../../utils/exporter'
import { uninstallMod } from '../../protocol/uninstaller'
import { VERSIONS_PATH, RESOURCES_VERSIONS_PATH, RESOURCES_MODS_INDEX_FILE_NAME,
  RESOURCES_VERSIONS_INDEX_PATH } from '../../constants'
import { autoNotices } from '../../utils'

interface Ret { path: string, installed: ResourceMod[], mods: string[], unUninstallable: ResourceMod[] }

const cache = new OneCache()

const NIL: Ret = { path: '', installed: [], mods: [], unUninstallable: [] }
const useVersion = createResource(async (ver: string): Promise<Ret> => {
  if (!ver) return NIL
  try {
    ver = await profilesStore.resolveVersion(ver)
    const path = join(VERSIONS_PATH, ver, 'mods')
    if (!await fs.pathExists(path)) return NIL
    let files = (await fs.readdir(path)).filter(it => it.endsWith('.jar'))
    const stats = await Promise.all(files.map(it => fs.stat(join(path, it))))
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
    } else unUninstallable = []
    return { path, installed, unUninstallable, mods: files.filter(it => !hashes.has(basename(it, '.jar'))) }
  } catch (e) { console.error(e) }
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
      autoNotices(uninstallMod(p.version, id, d)).finally(() => {
        cache.delete(cache.key)
        setLoading(false)
      })
    }
  })
  const ver = useVersion(p.version)
  const ps = useStore(ProfilesStore)
  return ver.mods.length + ver.installed.length + ver.unUninstallable.length ? <ul className='scrollable'>
    {ver.installed.map(it => <li key={it.id}>
      {it.title ? <>{it.title} <span>({it.id})</span></> : it.id}
      <div className='time'>{it.description}</div>
      <div className='buttons'>
        {(!ps.extraJson.copyMode || typeof it.source === 'string') &&
          <button
            className='btn2'
            onClick={() => {
              if (ps.extraJson.copyMode) {
                clipboard.writeText(it.source)
                notice({ content: $('Copied!') })
              } else autoNotices(exportResource(it))
            }}
          >{$('Export')}</button>}
        <button className='btn2 danger' onClick={() => requestUninstall(it.id)}>{$('Delete')}</button>
      </div>
    </li>)}
    {ver.mods.map(it => <li key={it}>
      {it}
      <div className='buttons'>
        {!ps.extraJson.copyMode &&
          <button
            className='btn2'
            onClick={() => autoNotices(exportUnidentified(join(ver.path, it), 'Mod'))}
          >{$('Export')}</button>}
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
  return <div className='manager-list version-switch manager-versions manager-mods'>
    <div className='list-top'>
      <span className='header no-button'>{$('Mods')} - {profile.name || $('No Title')} ({profile.lastVersionId})</span>
    </div>
    <Suspense fallback={<div style={{ flex: 1, display: 'flex' }}><Loading /></div>}>
      <Version version={version} />
    </Suspense>
  </div>
}

export default Mods
