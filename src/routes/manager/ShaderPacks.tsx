import './list.less'
import fs from 'fs-extra'
import ToolTip from 'rc-tooltip'
import history from '../../utils/history'
import Empty from '../../components/Empty'
import Loading from '../../components/Loading'
import React, { useState, useEffect } from 'react'
import { join, basename } from 'path'
import { plugins } from '../../plugin/internal/index'
import { removeFormatCodes, autoNotices, watchFile } from '../../utils/index'
import { SHADER_PACKS_PATH } from '../../constants'
import { requestPath } from '../../protocol/exporter'
import { remote, shell } from 'electron'

pluginMaster.addExtensionsButton({
  title: () => $('ShaderPacks'),
  key: 'shaderPacks',
  onClick () { history.push('/manager/shaderPacks') }
}, plugins.resourceInstaller)

const getShaderPacks = async () => {
  try {
    const ret = await Promise.all((await fs.readdir(SHADER_PACKS_PATH)).filter(it => it.endsWith('.zip'))
      .map(async it => {
        const path = join(SHADER_PACKS_PATH, it)
        if (!(await fs.stat(path)).isFile()) return
        return [
          basename(removeFormatCodes(it), '.zip'),
          path
        ] as [string, string]
      }))
    return ret.filter(Boolean)
  } catch (e) { console.error(e) }
  return []
}

const ShaderPack: React.FC = () => {
  const [packs, setPacks] = useState<Array<[string, string]>>()
  useEffect(() => watchFile(SHADER_PACKS_PATH, () => setPacks(null)), [])
  useEffect(() => { if (!packs) getShaderPacks().then(setPacks) }, [packs])
  const requestUninstall = (path: string) => packs && openConfirmDialog({
    cancelButton: true,
    title: $('Warning!'),
    text: $('Are you sure to delete this {0}? Files can be recovered in the recycle bin.', $('shader pack'))
  }).then(ok => {
    if (ok) {
      notice({ content: $('Deleting...') })
      autoNotices(shell.moveItemToTrash(path))
      setPacks(null)
    }
  })
  return packs ? packs.length ? <ul className='scrollable'>
    {packs.map(it => <li
      key={it[0]}
      draggable='true'
      onDragStart={e => {
        e.preventDefault()
        remote.getCurrentWebContents().startDrag({ file: it[0], icon: it[1] })
      }}
    >
      <div>{it[0]}</div>
      <div className='buttons'>
        <button
          className='btn2'
          onClick={() => autoNotices(requestPath().then(path => fs.copyFile(it[1], path)))}
        >{$('Export')}</button>
        <button className='btn2 danger' onClick={() => requestUninstall(it[0])}>{$('Delete')}</button>
      </div>
    </li>)}
  </ul> : <Empty /> : <div style={{ flex: 1, display: 'flex' }}><Loading /></div>
}

const ShaderPacks: React.FC = () => {
  return <div className='manager-list version-switch manager-versions resource-packs'>
    <div className='list-top'>
      <ToolTip placement='top' overlay={$('Click here to open the directory')}>
        <span data-sound className='header no-button' onClick={() => shell.openItem(SHADER_PACKS_PATH)}>
          {$('ShaderPacks')}</span>
      </ToolTip>
    </div>
    <ShaderPack />
  </div>
}

export default ShaderPacks
