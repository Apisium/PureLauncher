import './list.less'
import fs from 'fs-extra'
import ToolTip from 'rc-tooltip'
import history from '../../utils/history'
import Empty from '../../components/Empty'
import Loading from '../../components/Loading'
import ProfilesStore from '../../models/ProfilesStore'
import React, { useState, useEffect } from 'react'
import { join, basename } from 'path'
import { plugins } from '../../plugin/internal/index'
import { removeFormatCodes, autoNotices, watchFile } from '../../utils/index'
import { ResourcePack as RPP } from '@xmcl/resourcepack/index'
import { ResourceResourcePack } from '../../protocol/types'
import { uninstallResourcePack } from '../../protocol/uninstaller'
import { RESOURCES_RESOURCE_PACKS_INDEX_PATH, RESOURCE_PACKS_PATH } from '../../constants'
import { exportResource, exportUnidentified } from '../../protocol/exporter'
import { useStore } from 'reqwq'
import { clipboard, remote, shell } from 'electron'

pluginMaster.addExtensionsButton({
  title: () => $('ResourcePacks'),
  key: 'resource-packs',
  onClick () { history.push('/manager/resourcePacks') }
}, plugins.resourceInstaller)

interface Ret { installed: ResourceResourcePack[], unidentified: string[][] }

const NIL: Ret = { installed: [], unidentified: [] }
const getResourcePacks = async (): Promise<Ret> => {
  try {
    let files = (await fs.readdir(RESOURCE_PACKS_PATH)).filter(it => it.endsWith('.zip'))
    const stats = await Promise.all(files.map(it => fs.stat(join(RESOURCE_PACKS_PATH, it)).catch(() => null)))
    files = files.filter((_, i) => stats[i]?.isFile())
    const json: Record<string, ResourceResourcePack> =
      await fs.readJson(RESOURCES_RESOURCE_PACKS_INDEX_PATH, { throws: false }) || { }
    const hashes = new Set<string>()
    const installed = Object.values(json)
    installed.forEach(it => it?.hashes?.forEach(h => hashes.add(h)))
    return { installed, unidentified: (await Promise.all(files.filter(it => !hashes.has(basename(it, '.zip')))
      .map(it => RPP.open(join(RESOURCE_PACKS_PATH, it))
        .then(r => Promise.all([r.icon(), r.info()]))
        .then(([icon, info]) => [
          it,
          icon ? URL.createObjectURL(new Blob([icon], { type: 'image/png' })) : null,
          typeof info.description === 'string' ? removeFormatCodes(info.description) : null
        ]).catch(e => {
          console.error(e)
          return [it]
        })))).sort((a, b) => +!a[1] - +!b[1]) }
  } catch (e) { console.error(e) }
  return NIL
}

const ResourcePackList: React.FC = () => {
  const [packs, setPacks] = useState<Ret>()
  useEffect(() => watchFile(RESOURCE_PACKS_PATH, () => setPacks(null)), [])
  useEffect(() => { if (!packs) getResourcePacks().then(setPacks) }, [packs])
  const requestUninstall = (id: string, d?: boolean) => packs && openConfirmDialog({
    cancelButton: true,
    title: $('Warning!'),
    text: $(
      d ? 'Are you sure to delete this {0}? Files can be recovered in the recycle bin.'
        : 'Are you sure to delete this {0}? This is a dangerous operation and cannot be recovered after deletion!',
      $('resource pack')
    )
  }).then(ok => {
    if (ok) {
      setPacks(null)
      notice({ content: $('Deleting...') })
      autoNotices(uninstallResourcePack(id, d)).finally(() => setPacks(null))
    }
  })
  const ps = useStore(ProfilesStore)
  return packs ? packs.installed.length + packs.unidentified.length ? <ul className='scrollable'>
    {packs.installed.map(it => <li key={it.id}>
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
    {packs.unidentified.map(it => <li
      key={it[0]}
      draggable='true'
      onDragStart={e => {
        e.preventDefault()
        remote.getCurrentWebContents().startDrag({ file: it[0], icon: it[1] })
      }}
    >
      {it[1] && <img src={it[1]} alt={it[0]} />}
      {it[2] ? <div>{it[0]}<div className='time'>{it[2]}</div></div> : it[0]}
      <div className='buttons'>
        {!ps.extraJson.copyMode &&
          <button
            className='btn2'
            onClick={() => autoNotices(exportUnidentified(join(RESOURCE_PACKS_PATH, it[0]),
              'ResourcePack', it[2] ? { description: it[2] } : undefined))}
          >{$('Export')}</button>}
        <button className='btn2 danger' onClick={() => requestUninstall(it[0], true)}>{$('Delete')}</button>
      </div>
    </li>)}
  </ul> : <Empty /> : <div style={{ flex: 1, display: 'flex' }}><Loading /></div>
}

const ResourcePacks: React.FC = () => {
  return <div className='manager-list version-switch manager-versions resource-packs'>
    <div className='list-top'>
      <ToolTip placement='top' overlay={$('Click here to open the directory')}>
        <span data-sound className='header no-button' onClick={() => shell.openItem(RESOURCE_PACKS_PATH)}>
          {$('ResourcePacks')}</span>
      </ToolTip>
    </div>
    <ResourcePackList />
  </div>
}

export default ResourcePacks
