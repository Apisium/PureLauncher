import { plugin, Plugin, event } from '../Plugin'
import { version } from '../../../package.json'
import { download, genId, appDir } from '../../utils/index'
import { remote } from 'electron'
import { join } from 'path'
import { createHash } from 'crypto'
import pAll from 'p-all'
import fs from 'fs-extra'
import * as T from '../../protocol/types'

@plugin({ id: '@pure-launcher/resource-installer', version, description: $("PureLauncher's built-in plugin") })
export default class ResourceInstaller extends Plugin {
  @event()
  public async protocolInstallProcess (r: T.AllResources | T.ResourceVersion, o: T.InstallView<any>) {
    console.log(r)
    switch (r.type) {
      case 'Mod':
        o.versionPicker = true
        break
      case 'Version':
        if (r.resources) {
          await pAll(Object.entries(r.resources).map(([key, v]) => typeof v === 'string' &&
            (() => fetch(v).then(it => it.json()).then(it => (r.resources[key] = it)))), { concurrency: 8 })
        }
    }
  }
  @event()
  public async protocolInstallResource (r: T.AllResources | T.ResourceVersion) {
    switch (r.type) {
      case 'Server':
        // TODO:
        break
      case 'Mod':
        // TODO:
        break
      case 'ResourcesPack':
        await this.installResourcePack(r)
        break
      case 'Plugin':
        // TODO:
        break
      case 'Version':
        await this.installVersion(r)
        break
    }
  }

  public async installVersion (r: T.ResourceVersion) {
  }
  public async installResourcePack (r: T.ResourceResourcesPack) {
    const p = join(remote.app.getPath('temp'), genId())
    const urls: Array<{ url: string, file: string }> = r.urls.map((url, it) => ({ url, file: join(p, it.toString()) }))
    await fs.mkdir(p)
    try {
      await download(urls[0], r.title || r.id)
      const hashes = await pAll(urls.map((it, i) => () => new Promise<string>((resolve, e) => {
        const s = createHash('sha1').setEncoding('hex')
        fs.createReadStream(it.file).on('error', e).pipe(s).on('error', e).on('finish', () => {
          const hash = s.read() as string
          if (!r.hashes || hash === r.hashes[i]) resolve(hash)
          else e(new Error($('Hash is different: {0} -> {1}', hash, r.hashes[i])))
        })
      })), { concurrency: 6 })
      const dir = join(__profilesStore.root, 'resourcepacks')
      await fs.ensureDir(dir)
      await pAll(urls.map((it, i) => () => {
        const path = join(dir, hashes[i] + '.zip')
        return fs.pathExists(path).then(t => t && fs.remove(path)).then(() => fs.rename(it.file, path))
      }), { concurrency: 8 })
      const jsonPath = join(appDir, 'resources/resource-pack-index.json')
      let json = { }
      try { json = await fs.readJson(jsonPath) } catch (e) { }
      if (!json || typeof json !== 'object') json = { }
      r.hashes = hashes
      json[r.id] = r
      await fs.outputJson(jsonPath, json)
      notice({ content: $('Successfully installed resources!') })
    } catch (e) {
      console.error(e)
      notice({ error: true, content: $('Failed to install resources!') })
      await fs.remove(p).catch(console.error)
    }
  }
}
