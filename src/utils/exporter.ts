import fs from 'fs-extra'
import { ZipFile } from 'yazl'
import { Stream } from 'stream'
import { remote } from 'electron'
import { join, basename } from 'path'
import { ResourceVersion, ResourceMod, ResourceResourcesPack, Resource } from '../protocol/types'
import { RESOURCES_VERSIONS_INDEX_PATH, VERSIONS_PATH, RESOURCE_PACKS_PATH } from '../constants'

const waitEnd = (stream: Stream) => new Promise((resolve, reject) => stream.once('end', resolve).once('error', reject))

const html = Buffer.from(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>PureLauncher Installer</title>
</head>
<body>
  Loading...
  <script>
    location.href = 'https://pl.apisium.com/install-local.html?' + encodeURIComponent(location.href)
  </script>
</body>
</html>`)

const requestPath = (name?: string) => remote.dialog.showSaveDialog(remote.getCurrentWindow(), {
  defaultPath: name ? name + '.zip' : undefined,
  filters: [{ name: $('Zip file'), extensions: ['zip'] }]
}).then(it => {
  if (it.canceled) {
    notice({ content: $('Exporting...') })
    return it.filePath
  }
})

export const exportVersion = async (key: string, path?: string) => {
  const ver = await profilesStore.resolveVersion(key)
  if (!path) path = await requestPath(ver)
  if (!path) return
  const json: ResourceVersion = (await fs.readJson(RESOURCES_VERSIONS_INDEX_PATH, { throws: false }) || { })[ver]
  const zip = new ZipFile()
  zip.outputStream.pipe(fs.createWriteStream(path))
  zip.addBuffer(html, 'install - 安装.html')
  if (json) {
    if (json.source) zip.addBuffer(Buffer.from(json.source), 'resource-manifest')
    else {
      const output: any = { ...json }
      delete output.resolvedId
      zip.addBuffer(Buffer.from(JSON.stringify(output)), 'resource-manifest.json')
    }
  }
  let dir = join(VERSIONS_PATH, ver, 'mods')
  const local: Resource[] = []
  if (await fs.pathExists(dir)) {
    const arr = (await fs.readdir(dir)).filter(it => it.endsWith('.jar') && it.length !== 44)
    arr.forEach(it => {
      zip.addFile(join(dir, it), 'mods/' + it)
      const id = basename(it, '.jar')
      const mod: Omit<ResourceMod, 'urls' | 'version'> = {
        id,
        type: 'Mod'
      }
      local.push(mod)
    })
  }
  dir = join(RESOURCE_PACKS_PATH)
  if (await fs.pathExists(dir)) {
    const arr = (await fs.readdir(dir)).filter(it => it.endsWith('.zip') && it.length !== 44)
    arr.forEach(it => {
      zip.addFile(join(dir, it), 'resourcepacks/' + it)
      const id = basename(it, '.zip')
      const resourcePack: Omit<ResourceResourcesPack, 'urls' | 'version'> = {
        id,
        type: 'ResourcesPack'
      }
      local.push(resourcePack)
    })
  }
  if (local.length) zip.addBuffer(Buffer.from(JSON.stringify(local)), 'local-rsources.json')
  zip.end()
  await waitEnd(zip.outputStream)
}

export const exportResource = async (mod: ResourceMod | ResourceResourcesPack, path?: string) => {
  if (!path) path = await requestPath(mod.id)
  if (!path) return
  const zip = new ZipFile()
  zip.outputStream.pipe(fs.createWriteStream(path))
  zip.addBuffer(html, 'install - 安装.html')
  zip.addBuffer(Buffer.from(JSON.stringify(mod)), 'resource-manifest.json')
  zip.end()
  await waitEnd(zip.outputStream)
}

export const exportUnidentified = async (file: string, type: string, ext: any = { }, path?: string) => {
  const name = basename(file)
  if (!path) path = await requestPath(name)
  if (!path) return
  const zip = new ZipFile()
  zip.outputStream.pipe(fs.createWriteStream(path))
  zip.addBuffer(html, 'install - 安装.html')
  zip.addFile(file, name)
  zip.addBuffer(Buffer.from(JSON.stringify({ ...ext, file, type })), 'local-resource.json')
  zip.end()
  await waitEnd(zip.outputStream)
}
