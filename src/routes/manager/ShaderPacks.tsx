import './list.less'
import fs from 'fs-extra'
import history from '../../utils/history'
import Empty from '../../components/Empty'
import Loading from '../../components/Loading'
import React, { Suspense, useState, useMemo } from 'react'
import { join, basename } from 'path'
import { plugins } from '../../plugin/internal/index'
import { removeFormatCodes, autoNotices } from '../../utils/index'
import { createResource, OneCache } from 'react-cache-enhance'
import { SHADER_PACKS_PATH } from '../../constants'
import { requestPath } from '../../protocol/exporter'
import { remote, shell } from 'electron'

pluginMaster.addExtensionsButton({
  title: () => $('ShaderPacks'),
  key: 'shaderPacks',
  onClick () { history.push('/manager/shaderPacks') }
}, plugins.resourceInstaller)

const cache = new OneCache()

const useShaderPacks = createResource(async () => {
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
}, cache as any)

const ShaderPack: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const pack = useShaderPacks()
  useMemo(() => cache.delete(cache.key), [0])
  const requestUninstall = (path: string) => !loading && openConfirmDialog({
    cancelButton: true,
    title: $('Warning!'),
    text: $('Are you sure to delete this {0}? Files can be recovered in the recycle bin.', $('shader pack'))
  }).then(ok => {
    if (ok) {
      setLoading(true)
      notice({ content: $('Deleting...') })
      // eslint-disable-next-line prefer-promise-reject-errors
      autoNotices(shell.moveItemToTrash(path) ? Promise.resolve() : Promise.reject()).finally(() => {
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
      <div>{it[0]}</div>
      <div className='buttons'>
        <button
          className='btn2'
          onClick={() => autoNotices(requestPath().then(path => fs.copyFile(it[1], path)))}
        >{$('Export')}</button>
        <button className='btn2 danger' onClick={() => requestUninstall(it[0])}>{$('Delete')}</button>
      </div>
    </li>)}
  </ul> : <Empty />
}

const ShaderPacks: React.FC = () => {
  return <div className='manager-list version-switch manager-versions resource-packs'>
    <div className='list-top'>
      <span className='header no-button'>{$('ShaderPacks')}</span>
    </div>
    <Suspense fallback={<div style={{ flex: 1, display: 'flex' }}><Loading /></div>}><ShaderPack /></Suspense>
  </div>
}

export default ShaderPacks
