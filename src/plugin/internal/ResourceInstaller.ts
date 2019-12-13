import { plugin, Plugin, event } from '../Plugin'
import { version } from '../../../package.json'
import { download, makeTempDir, appDir, getJson, DownloadItem } from '../../utils/index'
import { join } from 'path'
import { createHash } from 'crypto'
import pAll from 'p-all'
import fs from 'fs-extra'
import versionSelector from '../../components/VersionSelector'
import * as T from '../../protocol/types'
import { Version } from '../../models/ProfilesStore'

const downloadAndCheckHash = (urls: DownloadItem[], r: T.Resource & { hashes?: string[] }) =>
  download(urls.length === 1 ? urls[0] : urls, r.title || r.id)
    .then(() => pAll(urls.map((it, i) => () => new Promise<string>((resolve, e) => {
      const s = createHash('sha1').setEncoding('hex')
      fs.createReadStream(it.file).on('error', e).pipe(s).on('error', e).on('finish', () => {
        const hash = s.read() as string
        if (!r.hashes || hash === r.hashes[i]) resolve(hash)
        else e(new Error($('Hash is different: {0} -> {1}', hash, r.hashes[i])))
      })
    })), { concurrency: 6 }))

@plugin({ id: '@pure-launcher/resource-installer', version, description: $("PureLauncher's built-in plugin") })
export default class ResourceInstaller extends Plugin {
  public onUnload () {}
  @event()
  public async protocolInstallProcess (r: T.AllResources | T.ResourceVersion, o?: T.InstallView) {
    if (!o) return
    switch (r.type) {
      case 'Mod': {
        o.render = versionSelector(o)
        break
      }
      case 'Version':
        if (r.resources) {
          await pAll(Object.entries(r.resources).map(([key, v]) => typeof v === 'string' &&
            (() => getJson(v).then(it => (r.resources[key] = it)))).filter(Boolean), { concurrency: 8 })
        }
    }
  }
  @event(null, true)
  public async protocolInstallResource (r: T.AllResources | T.ResourceVersion, o: T.InstallView) {
    switch (r.type) {
      case 'Server':
        await this.installServer(r)
        break
      case 'Mod':
        await this.installMod(r, o)
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

  public async installServer (r: T.ResourceServer) {
  }

  public async installVersion (r: T.ResourceVersion) {
  }

  public async installResourcePack (r: T.ResourceResourcesPack) {
    if (typeof r !== 'object' || r.type !== 'ResourcesPack' || !r.id) throw new TypeError('Incorrect resource type!')
    let ext = r.extends
    if (ext) {
      if (typeof ext === 'string') ext = await getJson(ext)
      await pluginMaster.emitSync('protocolInstallProcess', ext)
      await this.installResourcePack(ext as T.ResourceResourcesPack)
    }
    const p = await makeTempDir()
    const urls: Array<{ url: string, file: string }> = r.urls.map((url, it) => ({ url, file: join(p, it.toString()) }))
    try {
      const hashes = await downloadAndCheckHash(urls, r)
      const dir = join(profilesStore.root, 'resourcepacks')
      await fs.ensureDir(dir)
      await pAll(urls.map((it, i) => () => {
        const path = join(dir, hashes[i] + '.zip')
        return fs.pathExists(path).then(t => t && fs.remove(path)).then(() => fs.rename(it.file, path))
      }), { concurrency: 8 })
      const jsonPath = join(appDir, 'resources/resource-pack-index.json')
      let json = await fs.readJson(jsonPath, { throws: false })
      if (!json || typeof json !== 'object') json = { }
      r.hashes = hashes
      json[r.id] = r
      await fs.outputJson(jsonPath, json)
    } finally {
      await fs.remove(p).catch(console.error)
    }
  }

  public async installMod (r: T.ResourceMod, o: T.InstallView, dir?: string) {
    if (typeof r !== 'object' || r.type !== 'Mod' || !r.id) throw new TypeError('Incorrect resource type!')
    if (!dir) {
      const version = profilesStore.profiles[o.selectedVersion]!
      let id = version.lastVersionId
      switch (version.type) {
        case 'latest-snapshot':
          await profilesStore.ensureVersionManifest()
          id = profilesStore.versionManifest.latest.snapshot
          break
        case 'latest-release':
          await profilesStore.ensureVersionManifest()
          id = profilesStore.versionManifest.latest.release
      }
      dir = join(profilesStore.root, 'versions', id, 'mods')
      await fs.ensureDir(dir)
    }
    let ext = r.extends
    if (ext) {
      if (typeof ext === 'string') ext = await getJson(ext)
      await pluginMaster.emitSync('protocolInstallProcess', ext)
      await this.installMod(ext as T.ResourceMod, o, dir)
    }
    const p = await makeTempDir()
    const urls: Array<{ url: string, file: string }> = r.urls.map((url, it) => ({ url, file: join(p, it.toString()) }))
    try {
      const hashes = await downloadAndCheckHash(urls, r)
      await pAll(urls.map((it, i) => () => {
        const path = join(dir, hashes[i] + '.jar')
        return fs.pathExists(path).then(t => t && fs.remove(path)).then(() => fs.rename(it.file, path))
      }), { concurrency: 8 })
      const jsonPath = join(dir, '../mods-index.json')
      let json = await fs.readJson(jsonPath, { throws: false })
      if (!json || typeof json !== 'object') json = { }
      r.hashes = hashes
      json[r.id] = r
      await fs.outputJson(jsonPath, json)
    } finally {
      await fs.remove(p).catch(console.error)
    }
  }
}
