import './list.less'
import fs from 'fs-extra'
import history from '../../utils/history'
import Empty from '../../components/Empty'
import Loading from '../../components/Loading'
import React, { Suspense, useState, useMemo } from 'react'
import { join } from 'path'
import { deserialize } from '@xmcl/nbt'
import { plugins } from '../../plugin/internal/index'
import { removeFormatCodes, autoNotices } from '../../utils/index'
import { createResource, OneCache } from 'react-cache-enhance'
import { WORLDS_PATH } from '../../constants'
import { exportWorld } from '../../protocol/exporter'
import { remote, shell } from 'electron'

pluginMaster.addExtensionsButton({
  title: () => $('Worlds'),
  key: 'worlds',
  onClick () { history.push('/manager/worlds') }
}, plugins.resourceInstaller)

const cache = new OneCache()

const icon = require('../../assets/images/unknown-server.png')

const useWorlds = createResource(async () => {
  try {
    const ret = await Promise.all((await fs.readdir(WORLDS_PATH)).map(async it => {
      const path = join(WORLDS_PATH, it)
      const level = join(path, 'level.dat')
      if (!await fs.pathExists(level)) return
      const img = join(path, 'icon.png')
      return [
        it,
        removeFormatCodes((await deserialize<{ Data: { LevelName: string } }>(await fs.readFile(level))).Data.LevelName),
        await fs.pathExists(img) ? img.replace(/#/g, '%23') : icon,
        (await fs.stat(level)).mtimeMs
      ] as [string, string, string, number]
    }))
    return ret.filter(Boolean).sort((a, b) => b[3] - a[3])
  } catch (e) { console.error(e) }
  return []
}, cache as any)

const World: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const pack = useWorlds()
  useMemo(() => cache.delete(cache.key), [0])
  const requestUninstall = (id: string) => !loading && openConfirmDialog({
    cancelButton: true,
    title: $('Warning!'),
    text: $('Are you sure to delete this {0}? Files can be recovered in the recycle bin.', $('world'))
  }).then(ok => {
    if (ok) {
      setLoading(true)
      notice({ content: $('Deleting...') })
      // eslint-disable-next-line prefer-promise-reject-errors
      autoNotices(shell.moveItemToTrash(join(WORLDS_PATH, id)) ? Promise.resolve() : Promise.reject()).finally(() => {
        cache.delete(cache.key)
        setTimeout(setLoading, 500, false)
      })
    }
  })
  return pack.length ? <ul className='scrollable'>
    {pack.map(it => <li
      key={it[0]}
      draggable='true'
      onDragStart={e => {
        e.preventDefault()
        remote.getCurrentWebContents().startDrag({ file: it[0], icon: it[1] })
      }}
    >
      <img src={it[2]} alt={it[0]} />
      <div><div>{it[1]}</div><div className='time'>{it[0]}</div></div>
      <div className='buttons'>
        <button
          className='btn2'
          onClick={() => autoNotices(exportWorld(join(WORLDS_PATH, it[0])))}
        >{$('Export')}</button>
        <button className='btn2 danger' onClick={() => requestUninstall(it[0])}>{$('Delete')}</button>
      </div>
    </li>)}
  </ul> : <Empty />
}

const Worlds: React.FC = () => {
  return <div className='manager-list version-switch manager-versions resource-packs'>
    <div className='list-top'>
      <span className='header no-button'>{$('Worlds')}</span>
    </div>
    <Suspense fallback={<div style={{ flex: 1, display: 'flex' }}><Loading /></div>}><World /></Suspense>
  </div>
}

export default Worlds
