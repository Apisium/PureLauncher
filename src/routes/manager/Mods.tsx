import './list.less'
import fs from 'fs-extra'
import ToolTip from 'rc-tooltip'
import Empty from '../../components/Empty'
import Loading from '../../components/Loading'
import ProfilesStore, { Version } from '../../models/ProfilesStore'
import React, { useState, useEffect, useRef } from 'react'
import { clipboard, shell } from 'electron'
import { ResourceMod, ResourceVersion, isMod } from '../../protocol/types'
import { join, basename } from 'path'
import { useParams } from 'react-router-dom'
import { useStore } from 'reqwq'
import { exportResource, exportUnidentified } from '../../protocol/exporter'
import { uninstallMod } from '../../protocol/uninstaller'
import { VERSIONS_PATH, RESOURCES_VERSIONS_PATH, RESOURCES_MODS_INDEX_FILE_NAME,
  RESOURCES_VERSIONS_INDEX_PATH } from '../../constants'
import { autoNotices, watchFile } from '../../utils'

interface Ret { path: string, installed: ResourceMod[], mods: string[], unUninstallable: ResourceMod[], ver: string }

const NIL: Ret = { path: '', installed: [], mods: [], unUninstallable: [], ver: '' }
const getMods = async (ver: string): Promise<Ret> => {
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
    return { path, installed, ver, unUninstallable, mods: files.filter(it => !hashes.has(basename(it, '.jar'))) }
  } catch (e) { console.error(e) }
  return NIL
}

const Mods: React.FC = () => {
  const { version } = useParams<{ version: string }>()
  const [mods, setMods] = useState<Ret>()
  const ref = useRef<() => void>()
  useEffect(() => {
    const f = () => {
      if (!ref.current) return
      ref.current()
      ref.current = null
    }
    if (!mods) {
      getMods(version).then(mods => {
        f()
        if (mods.path) ref.current = watchFile(mods.path, () => setMods(null))
        setMods(mods)
      })
    }
    return f
  }, [version, mods])
  const requestUninstall = (id: string, d?: boolean) => mods?.ver && openConfirmDialog({
    cancelButton: true,
    title: $('Warning!'),
    text: $(
      d ? 'Are you sure to delete this {0}? Files can be recovered in the recycle bin.'
        : 'Are you sure to delete this {0}? This is a dangerous operation and cannot be recovered after deletion!',
      $('mod')
    )
  }).then(ok => {
    if (ok) {
      notice({ content: $('Deleting...') })
      autoNotices(uninstallMod(mods.ver, id, d)).finally(() => setMods(null))
    }
  })
  const ps = useStore(ProfilesStore)
  const profile: Version = ps.profiles[version] || { } as any
  return <div className='manager-list version-switch manager-versions manager-mods'>
    <div className='list-top'>
      <ToolTip placement='top' overlay={$('Click here to open the directory')}>
        <span
          data-sound
          className='header no-button'
          onClick={() => mods?.ver && shell.openItem(mods.path)}>
          {$('Mods')} - {profile.name || $('No Title')} ({profile.lastVersionId})
        </span>
      </ToolTip>
    </div>
    {mods ? mods.ver && mods.mods.length + mods.installed.length + mods.unUninstallable.length
      ? <ul className='scrollable'>
        {mods.installed.map(it => <li key={it.id}>
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
        {mods.mods.map(it => <li key={it}>
          {it}
          <div className='buttons'>
            {!ps.extraJson.copyMode &&
              <button
                className='btn2'
                onClick={() => autoNotices(exportUnidentified(join(mods.path, it), 'Mod'))}
              >{$('Export')}</button>}
            <button className='btn2 danger' onClick={() => requestUninstall(it, true)}>{$('Delete')}</button>
          </div>
        </li>)}
        {mods.unUninstallable.map(it => <li key={it.id}>
          {it.title ? <>{it.title} <span>({it.id})</span></> : it.id}
          <div className='time'>{it.description}</div>
        </li>)}
      </ul> : <Empty /> : <div style={{ flex: 1, display: 'flex' }}><Loading /></div>}
  </div>
}

export default Mods
