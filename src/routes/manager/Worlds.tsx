import './list.less'
import fs from 'fs-extra'
import ToolTip from 'rc-tooltip'
import history from '../../utils/history'
import Empty from '../../components/Empty'
import Loading from '../../components/Loading'
import React, { useState, useEffect } from 'react'
import { join } from 'path'
import { deserialize } from '@xmcl/nbt/index'
import { plugins } from '../../plugin/internal/index'
import { removeFormatCodes, autoNotices, watchFile } from '../../utils/index'
import { WORLDS_PATH } from '../../constants'
import { exportWorld } from '../../protocol/exporter'
import { remote, shell } from 'electron'

pluginMaster.addExtensionsButton({
  title: () => $('Worlds'),
  key: 'worlds',
  onClick () { history.push('/manager/worlds') }
}, plugins.resourceInstaller)

const icon = require('../../assets/images/unknown-server.png')

const getWorlds = async () => {
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
}

const WorldsList: React.FC = () => {
  const [worlds, setWorlds] = useState<Array<[string, string, string, number]>>()
  useEffect(() => watchFile(WORLDS_PATH, () => setWorlds(null)), [])
  useEffect(() => { if (!worlds) getWorlds().then(setWorlds) }, [worlds])
  const requestUninstall = (id: string) => !worlds && openConfirmDialog({
    cancelButton: true,
    title: $('Warning!'),
    text: $('Are you sure to delete this {0}? Files can be recovered in the recycle bin.', $('world'))
  }).then(ok => {
    if (ok) {
      notice({ content: $('Deleting...') })
      autoNotices(shell.moveItemToTrash(join(WORLDS_PATH, id)))
      setWorlds(null)
    }
  })
  return worlds ? worlds.length ? <ul className='scrollable'>
    {worlds.map(it => <li
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
  </ul> : <Empty /> : <div style={{ flex: 1, display: 'flex' }}><Loading /></div>
}

const Worlds: React.FC = () => {
  return <div className='manager-list version-switch manager-versions resource-packs'>
    <div className='list-top'>
      <ToolTip placement='top' overlay={$('Click here to open the directory')}>
        <span data-sound className='header no-button' onClick={() => shell.openItem(WORLDS_PATH)}>{$('Worlds')}</span>
      </ToolTip>
    </div>
    <WorldsList />
  </div>
}

export default Worlds
