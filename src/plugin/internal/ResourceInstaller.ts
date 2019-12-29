import { plugin, Plugin, event } from '../Plugin'
import { PLUGINS_ROOT } from '../index'
import { version } from '../../../package.json'
import { download, makeTempDir, appDir, getJson, DownloadItem, sha1, genId } from '../../utils/index'
import { join, dirname } from 'path'
import { gte, valid } from 'semver'
import pAll from 'p-all'
import fs from 'fs-extra'
import install from '../../protocol/install'
import versionSelector from '../../components/VersionSelector'
import * as T from '../../protocol/types'

export const allowExtensions = ['.js', '.mjs', '.asar']

const checkHash = (file: string, hash: string) => sha1(file).then(it => {
  if (hash !== it) return it
  else throw new Error($('Hash is different: {0} -> {1}', it, hash))
})
const downloadAndCheckHash = (urls: DownloadItem[], r: T.Resource & { hashes?: string[] }) =>
  download(urls.length === 1 ? urls[0] : urls, r.title || r.id)
    .then(() => pAll(urls.map((it, i) => r.hashes ? () => checkHash(it.file, r.hashes[i])
      : () => sha1(it.file)), { concurrency: 6 }))

@plugin({ id: '@pure-launcher/resource-installer', version, description: $("PureLauncher's built-in plugin") })
export default class ResourceInstaller extends Plugin {
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
        await this.installPlugin(r, true, o)
        break
      case 'Version':
        await this.installVersion(r, o)
        break
    }
  }

  public async installServer (_: T.ResourceServer) {
  }

  public async installVersion (r: T.ResourceVersion, o: T.InstallView = { }) {
    if (!T.isVersion(r)) throw new TypeError('Incorrect resource type!')
    if (!/^[.\w-]/.test(r.mcVersion)) throw new Error(`The mcVersion (${r.mcVersion}) is illegal!`)
    if (r.extends) {
      const obj = { confirmed: o.confirmed }
      await install(r.extends, false, true, T.isVersion, obj)
      if (obj.confirmed) o.confirmed = true
    }
    let json = r.json
    if (typeof json === 'string') json = await getJson<object>(json)
    ;(json as any).id = r.mcVersion
    await pluginMaster.emitSync('processResourceVersionJson', json)
    o.resolvedId = r.mcVersion
    const dir = o.resolvedDir = join(profilesStore.root, 'versions', r.mcVersion)
    await fs.ensureDir(dir)
    // TODO: install version
    await fs.writeJson(join(dir, r.mcVersion + '.json'), json)
    if (typeof r.resources === 'object') {
      await pAll(Object.values(r.resources).map(it => () =>
        install(it, false, true, r => T.isResource(r) && !T.isVersion(r), o)))
    }
  }

  public async installResourcePack (r: T.ResourceResourcesPack) {
    if (!r) return
    if (!T.isResourcesPack(r)) throw new TypeError('Incorrect resource type!')
    const jsonPath = join(appDir, 'resources/resource-packs-index.json')
    let json = await fs.readJson(jsonPath, { throws: false }) || { }
    if (r.id in json && gte(json[r.id].version, r.id)) return
    if (r.extends) await install(r.extends, false, true, T.isResourcesPack)
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
      json = await fs.readJson(jsonPath, { throws: false }) || { }
      r.hashes = hashes
      json[r.id] = r
      await fs.outputJson(jsonPath, json)
    } finally {
      await fs.remove(p).catch(console.error)
    }
  }

  public async installMod (r: T.ResourceMod, o: T.InstallView = { }, id?: string, dir?: string) {
    if (!r) return
    if (typeof r !== 'object' || r.type !== 'Mod' || !r.id || !valid(r.version)) {
      throw new TypeError('Incorrect resource type!')
    }
    const jsonPath = join(appDir, 'resources/versions', id, 'mods-index.json')
    let json = await fs.readJson(jsonPath, { throws: false }) || { }
    if (r.id in json && gte(json[r.id].version, r.id)) return
    if (!dir && o.resolvedDir) dir = join(o.resolvedDir, 'mods')
    if (!id && o.resolvedId) id = o.resolvedId
    if (!dir || !id) {
      const version = profilesStore.profiles[o.selectedVersion]
      if (version) {
        id = version.lastVersionId
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
        o.resolvedDir = dirname(dir)
        o.resolvedId = id
      }
    }
    if (!id) throw new Error('No suck version: ' + o.selectedVersion)
    if (r.extends) await install(r.extends, false, true, T.isMod, o)
    const p = await makeTempDir()
    const urls: Array<{ url: string, file: string }> = r.urls.map((url, it) => ({ url, file: join(p, it.toString()) }))
    try {
      const hashes = await downloadAndCheckHash(urls, r)
      await pAll(urls.map((it, i) => () => {
        const path = join(dir, hashes[i] + '.jar')
        return fs.pathExists(path).then(t => t && fs.remove(path)).then(() => fs.rename(it.file, path))
      }), { concurrency: 8 })
      json = await fs.readJson(jsonPath, { throws: false }) || { }
      r.hashes = hashes
      json[r.id] = r
      await fs.outputJson(jsonPath, json)
    } finally {
      await fs.remove(p).catch(console.error)
    }
  }

  public async installPlugin (r: T.ResourcePlugin, showDialog = false, o: T.InstallView = { }) {
    if (!r) return
    if (typeof r !== 'object' || r.type !== 'Plugin' || !r.id || !valid(r.version)) {
      throw new TypeError('Incorrect resource type!')
    }
    const jsonPath = join(appDir, 'resources/plugins-index.json')
    let json = await fs.readJson(jsonPath, { throws: false }) || { }
    if (r.id in json && gte(json[r.id].version, r.id)) return
    if (r.extension && !allowExtensions.includes(r.extension)) {
      throw new Error(`The extension: ${r.extension} is not allowed`)
    }
    if (!o.confirmed && showDialog && !await openConfirmDialog({
      cancelButton: true,
      text: $('Warning! Installing plugins, please confirm whether the plugin is safe! If the extension is a malicious plugin, it may cause damage to your computer!\n\nPlugin ID: {0}\nName: {1}',
        r.id, r.title || $('Unknown'))
    })) throw new Error('Canceled install plugin!')
    o.confirmed = true
    if (typeof r.dependencies === 'object' && r.dependencies) {
      await Promise.all(Object.values(r.dependencies).map(it => install(it, false, true, T.isPlugin, o)))
    }
    const p = await makeTempDir()
    try {
      const file = join(p, genId())
      await download({ url: r.url, file }, r.title || r.id)
      const hash = r.hash ? await checkHash(file, r.hash) : await sha1(file)
      await fs.ensureDir(PLUGINS_ROOT)
      const path = join(PLUGINS_ROOT, hash + (r.extension || '.asar'))
      if (await fs.pathExists(path)) await fs.unlink(path)
      await fs.rename(file, path)
      json = await fs.readJson(jsonPath, { throws: false }) || { }
      r.hash = hash
      json[r.id] = r
      await fs.outputJson(jsonPath, json)
    } finally {
      await fs.remove(p).catch(console.error)
    }
  }
}
