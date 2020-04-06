import React from 'react'
import fs from 'fs-extra'
import { ZipFile } from 'yazl'
import { Stream } from 'stream'
import { remote } from 'electron'
import { join, basename, extname } from 'path'
import { sha1, addDirectoryToZipFile, md5 } from '../utils'
import { ResourceVersion, ResourceMod, ResourceResourcePack, Resource } from './types'
import { RESOURCES_VERSIONS_INDEX_PATH, VERSIONS_PATH, RESOURCE_PACKS_PATH } from '../constants'

const str = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <meta name="renderer" content="webkit">
  <meta http-equiv="Cache-Control" content="no-siteapp" />
  <title data-t="indexTitle">PureLauncher | Redirecting</title>
</head>
<body>
  Redirecting...
  <script>location.href='https://pl.apisium.cn/install-local.html'</script>
</body>
</html>
`

let _buf: Buffer
const getBuffer = () => _buf || (_buf = Buffer.from(str))

const waitEnd = (stream: Stream) => new Promise((resolve, reject) => stream.once('end', resolve).once('error', reject))

export const requestPath = (name?: string, filters?: any) => remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
  defaultPath: name ? name + '.zip' : undefined,
  filters: filters || [{ name: $('Zip file'), extensions: ['zip'] }]
}).then(it => {
  if (!it.canceled || !it.filePath) {
    notice({ content: $('Exporting...') })
    return it.filePath
  }
  throw new Error($('canceled'))
})

const requestName = (def = Date.now().toString(36)) => {
  let value = ''
  const component = () => <div style={{ display: 'flex' }}>
    <input defaultValue={def} style={{ width: '100%' }} onChange={e => (value = e.target.value)} />
  </div>
  return openConfirmDialog({ text: $('Please provide a name for the resource to be exported:'), component })
    .then(() => value)
}

export const exportVersion = async (key: string, path?: string) => {
  const ver = await profilesStore.resolveVersion(key)
  if (!path) path = await requestPath(ver)
  const json: ResourceVersion = (await fs.readJson(RESOURCES_VERSIONS_INDEX_PATH, { throws: false }) || { })[ver]
  const zip = new ZipFile()
  zip.outputStream.pipe(fs.createWriteStream(path))
  const verRoot = join(VERSIONS_PATH, ver)
  if (json) {
    if (json.source) {
      const data: any = json.source
      if (json.needRename) {
        const title = await requestName()
        zip.addBuffer(Buffer.from(JSON.stringify({ title, id: (json.id ? json.id + '-' : '') + md5(title),
          extends: data })), 'resource-manifest.json')
      } else zip.addBuffer(Buffer.from(data), 'resource-manifest')
    } else {
      let output: any = { ...json }
      delete output.resolvedId
      if ('$forge' in output || '$fabric' in output || output.needRename) {
        const title = await requestName()
        output = { title, id: (output.id ? output.id + '-' : '') + md5(title), extends: output }
      }
      zip.addBuffer(Buffer.from(JSON.stringify(output)), 'resource-manifest.json')
    }
    if (!await openConfirmDialog({ text: $('Do you want to export MODS and resource packs?'), cancelButton: true })) {
      zip.end()
      await waitEnd(zip.outputStream)
    }
  } else {
    await profilesStore.ensureVersionManifest()
    if (profilesStore.versionManifest.versions.some(it => it.id === ver)) {
      zip.addBuffer(Buffer.from(JSON.stringify(
        { type: 'Version', mcVersion: ver, id: ver, $vanilla: true })), 'resource-manifest.json')
    } else {
      await openConfirmDialog({
        text: $('The current game version is not installed by PureLauncher, so the export may be incomplete!')
      })
    }
  }
  const dir = join(verRoot, 'mods')
  const local: Resource[] = []
  if (await fs.pathExists(dir)) {
    const arr = (await fs.readdir(dir)).filter(it => it.endsWith('.jar') && it.length !== 44)
    await Promise.all(arr.map(async it => {
      const file = join(dir, it)
      const hash = await sha1(file)
      zip.addFile(file, 'files/' + hash)
      const id = basename(it, '.jar')
      const mod: Omit<ResourceMod, 'urls' | 'version' | 'hashes'> & { hash: string } = {
        id,
        hash,
        type: 'Mod'
      }
      local.push(mod)
    }))
  }
  if (await fs.pathExists(RESOURCE_PACKS_PATH)) {
    const arr = (await fs.readdir(RESOURCE_PACKS_PATH)).filter(it => it.endsWith('.zip') && it.length !== 44)
    await Promise.all(arr.map(async it => {
      const file = join(RESOURCE_PACKS_PATH, it)
      const hash = await sha1(file)
      zip.addFile(file, 'files/' + hash)
      const id = basename(it, '.zip')
      const resourcePack: Omit<ResourceResourcePack, 'urls' | 'version' | 'hashes'> & { hash: string } = {
        id,
        hash,
        type: 'ResourcePack'
      }
      local.push(resourcePack)
    }))
  }
  if (local.length) zip.addBuffer(Buffer.from(JSON.stringify(local)), 'local-resources.json')
  zip.addBuffer(getBuffer(), $('HOW TO INSTALL') + '.html')
  zip.end()
  await waitEnd(zip.outputStream)
}

export const exportResource = async (r: ResourceMod | ResourceResourcePack, path?: string) => {
  if (!path) path = await requestPath(r.id)
  const zip = new ZipFile()
  zip.outputStream.pipe(fs.createWriteStream(path))
  if (r.source) zip.addBuffer(Buffer.from(r.source), 'resource-manifest')
  else zip.addBuffer(Buffer.from(JSON.stringify(r)), 'resource-manifest.json')
  zip.addBuffer(getBuffer(), $('HOW TO INSTALL') + '.html')
  zip.end()
  await waitEnd(zip.outputStream)
}

export const exportUnidentified = async (file: string, type: string, ext: any = { }, path?: string) => {
  const name = basename(file, extname(file))
  if (!path) path = await requestPath(name)
  const zip = new ZipFile()
  zip.outputStream.pipe(fs.createWriteStream(path))
  const hash = await sha1(file)
  zip.addFile(file, 'files/' + hash)
  zip.addBuffer(Buffer.from(JSON.stringify({ ...ext, id: name, type, hash })), 'local-resource.json')
  zip.end()
  await waitEnd(zip.outputStream)
}

export const exportWorld = async (path: string, file?: string) => {
  const name = basename(path)
  if (!file) file = await requestPath(name)
  const zip = new ZipFile()
  zip.outputStream.pipe(fs.createWriteStream(file))
  zip.addBuffer(Buffer.from(name), 'world-manifest')
  await addDirectoryToZipFile(zip, path)
  zip.addBuffer(getBuffer(), $('HOW TO INSTALL') + '.html')
  zip.end()
  await waitEnd(zip.outputStream)
}
