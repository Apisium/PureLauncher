import fs from 'fs-extra'
import { join } from 'path'
import { ZipFile } from 'yazl'
import { Stream } from 'stream'
import { remote } from 'electron'
import { ResourceVersion, ResourceMod, ResourceResourcesPack } from '../protocol/types'
import { RESOURCES_VERSIONS_INDEX_PATH, VERSIONS_PATH } from '../constants'

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
    location.href = 'https://pl.apisium.com/install-local?' + encodeURIComponent(location.href)
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
  const dir = join(VERSIONS_PATH, ver, 'mods')
  if (await fs.pathExists(dir)) {
    (await fs.readdir(dir)).filter(it => it.endsWith('.jar') && it.length !== 44)
      .forEach(it => zip.addFile(join(dir, it), 'mods/' + it))
  }
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
