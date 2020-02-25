import { join, dirname, resolve } from 'path'
import { version } from '../../../package.json'
import { plugin, Plugin, event } from '../Plugin'
import { serialize, deserialize, TagType } from '@xmcl/nbt'
import { download, makeTempDir, getJson, DownloadItem, sha1, genId, md5, validPath, replace } from '../../utils/index'
import { VERSIONS_PATH, RESOURCE_PACKS_PATH, RESOURCES_VERSIONS_PATH, RESOURCES_VERSIONS_INDEX_PATH,
  PLUGINS_ROOT, RESOURCES_RESOURCE_PACKS_INDEX_PATH, RESOURCES_PLUGINS_INDEX, SERVERS_PATH, SERVERS_FILE_NAME,
  RESOURCES_MODS_INDEX_FILE_NAME, DELETES_FILE, ALLOW_PLUGIN_EXTENSIONS } from '../../constants'
import pAll from 'p-all'
import fs from 'fs-extra'
import gte from 'semver/functions/gte'
import major from 'semver/functions/major'
import install from '../../protocol/install'
import versionSelector from '../../components/VersionSelector'
import * as T from '../../protocol/types'

class ServerInfo {
  @TagType(TagType.String)
  public icon = ''
  @TagType(TagType.String)
  public ip = ''
  @TagType(TagType.String)
  public name = ''
  @TagType(TagType.Byte)
  public acceptTextures = 0
  @TagType(TagType.Byte)
  public hideAddress = 0
}

class Servers {
  @TagType([ServerInfo])
  servers: ServerInfo[] = []
}

const checkHash = (file: string, hash: string) => sha1(file).then(it => {
  if (hash.trim() === it) return it.trim()
  else throw new Error($('Hash is different: {0} -> {1}', it, hash))
})
const downloadAndCheckHash = (urls: DownloadItem[], r: T.Resource & { hashes?: string[] }) =>
  download(urls.length === 1 ? urls[0] : urls, r.title || r.id)
    .then(() => pAll(urls.map((it, i) => r.hashes ? () => checkHash(it.file, r.hashes[i])
      : () => sha1(it.file)), { concurrency: 6 }))

@plugin({
  version,
  id: '@pure-launcher/resource-installer',
  description: () => $("PureLauncher's built-in plugin"),
  title: () => $('ResourcesInstaller')
})
export default class ResourceInstaller extends Plugin {
  @event()
  public async protocolPreInstallResource (r: T.AllResources | T.ResourceVersion, o?: T.InstallView) {
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
  public async protocolInstallResource (r: T.AllResources | T.ResourceVersion | T.ResourcePlugin, o: T.InstallView) {
    switch (r.type) {
      case 'Server':
        await this.installServer(r)
        break
      case 'Mod':
        await this.installMod(r, o)
        break
      case 'ResourcePack':
        await this.installResourcePack(r, o)
        break
      case 'Plugin':
        await this.installPlugin(r, true, o)
        break
      case 'Version':
        await this.installVersion(r, o)
        break
    }
  }

  public async installServer (r: T.ResourceServer, o: T.InstallView = { }) {
    const file = o.isolation ? join(VERSIONS_PATH, o.resolvedId, SERVERS_FILE_NAME) : SERVERS_PATH
    let data: Servers
    try {
      data = await deserialize(await fs.readFile(file), { type: Servers })
    } catch (e) {
      if (!e?.message.includes('no such file or directory')) console.error(e)
      data = new Servers()
    }
    let hostname = r.ip
    if (r.port) hostname += ':' + r.port
    let server = data.servers.find(it => it.ip === hostname)
    if (!server) data.servers.unshift((server = new ServerInfo()))
    if (typeof r.title === 'string') server.name = r.title
    if (typeof r.hideAddress === 'boolean') server.hideAddress = +r.hideAddress
    await fs.writeFile(file, serialize(data))
  }

  public async installVersion (r: T.ResourceVersion, o: T.InstallView = { }) {
    if (!T.isVersion(r)) throw new TypeError('Incorrect resource type!')
    const id = (r as any).resolvedId = r.useIdAsName ? r.id : `${r.mcVersion}-${md5(r.id)}-${major(r.version)}`
    const dir = resolve(VERSIONS_PATH, id)
    const old: T.ResourceVersion = (await fs.readJson(RESOURCES_VERSIONS_INDEX_PATH, { throws: false }) || { })[r.id]
    const jsonPath = join(dir, id + '.json')
    if (await fs.pathExists(jsonPath)) {
      if (old) {
        if (gte(old.version, r.version)) return
        o.oldResourceVersion = old
        if (typeof old.files === 'object') {
          await Promise.all(Object.keys(old.files)
            .map(name => fs.unlink(validPath(dir, replace(name, r))).catch(() => {})))
        }
      } else {
        if (!await openConfirmDialog({
          cancelButton: true,
          text: $('This version ({0}) already exists! Delete this version? Warning: cannot recover after deletion!', id)
        })) throw new Error('User refuses to delete existing version: ' + id)
        await fs.remove(dir)
      }
    }
    const obj: any = { confirmed: o.confirmed }
    if (r.extends) {
      await install(r.extends, false, true, T.isVersion, obj)
      if (obj.confirmed) o.confirmed = true
    }
    o.resolvedDir = dir
    await fs.ensureDir(dir)
    const p = await makeTempDir()
    try {
      const arr = typeof r.files === 'object' && Object.entries(r.files)
      if (arr && arr.length) {
        const urls: Array<{ url: string, file: string, absolute: string }> = arr.map(([name, url], i) =>
          ({ url: replace(url, r), file: join(p, i.toString()), absolute: validPath(dir, replace(name, r)) }))
        const hashes = await downloadAndCheckHash(urls, r)
        await pAll(urls.map(it => () => {
          const path = it.absolute
          return fs.pathExists(path).then(t => t && fs.remove(path)).then(() => fs.move(it.file, path))
        }), { concurrency: 8 })
        r.hashes = hashes
      } else {
        delete r.files
        delete r.hashes
      }

      const obj2 = { notWriteJson: false }
      await pluginMaster.emitSync('processResourceInstallVersion', r, obj2)
      if (!obj2.notWriteJson) {
        let json = r.json
        if (!json) json = { }
        else if (typeof json === 'string') json = await getJson<Record<string | number, any>>(replace(json, r))
        if (r.extends) json.extends = obj.resolvedId
        o.resolvedId = json.id = id
        await pluginMaster.emitSync('processResourceVersionJson', json)
        await fs.writeJson(jsonPath, json)
      }
      if (r.isolation) o.isolation = true
      if (typeof r.resources === 'object') {
        await pAll(Object.values(r.resources).map(it => () =>
          install(it, false, true, r => T.isResource(r) && !T.isVersion(r) && !T.isPlugin(r), o)), { concurrency: 5 })
      }
      const sJson = await fs.readJson(RESOURCES_VERSIONS_INDEX_PATH, { throws: false }) || { }
      delete r.json
      sJson[id] = r
      await fs.outputJson(RESOURCES_VERSIONS_INDEX_PATH, sJson)
      await profilesStore.addProfile(id, r.title, r.icon, true)
    } catch (e) {
      await fs.remove(dir)
      const sJson = await fs.readJson(RESOURCES_VERSIONS_INDEX_PATH, { throws: false }) || { }
      delete sJson[id]
      await fs.outputJson(RESOURCES_VERSIONS_INDEX_PATH, sJson)
      throw e
    } finally {
      await fs.remove(p)
    }
  }

  public async installResourcePack (r: T.ResourceResourcePack, o: T.InstallView = { }) {
    if (!r) return
    if (!T.isResourcePack(r)) throw new TypeError('Incorrect resource type!')
    const dir = o.isolation ? join(VERSIONS_PATH, o.resolvedId, 'resourcepacks') : RESOURCE_PACKS_PATH
    const old: T.ResourceResourcePack = o.oldResourceVersion ? o.oldResourceVersion.resources?.[r.id]
      : (await fs.readJson(RESOURCES_RESOURCE_PACKS_INDEX_PATH, { throws: false }) || { })[r.id]
    if (old) {
      if (gte(old.version, r.version)) return
      if (old.hashes) await Promise.all(old.hashes.map(it => fs.unlink(join(dir, it + '.zip')).catch(() => {})))
    }
    if (r.extends) await install(r.extends, false, true, T.isResourcePack)
    const p = await makeTempDir()
    const urls: Array<{ url: string, file: string }> = r.urls.map((url, it) =>
      ({ url: replace(url, r), file: join(p, it.toString()) }))
    try {
      const hashes = await downloadAndCheckHash(urls, r)
      await fs.ensureDir(dir)
      await pAll(urls.map((it, i) => () => {
        const path = join(dir, hashes[i] + '.zip')
        return fs.pathExists(path).then(t => t && fs.unlink(path)).then(() => fs.move(it.file, path))
      }), { concurrency: 8 })
      if (!o.isolation) {
        const json = await fs.readJson(RESOURCES_RESOURCE_PACKS_INDEX_PATH, { throws: false }) || { }
        r.hashes = hashes
        json[r.id] = r
        await fs.outputJson(RESOURCES_RESOURCE_PACKS_INDEX_PATH, json)
      }
    } finally {
      await fs.remove(p).catch(console.error)
    }
  }

  public async installMod (r: T.ResourceMod, o: T.InstallView = { }, id?: string, dir?: string) {
    if (!r) return
    if (!T.isMod(r)) throw new TypeError('Incorrect resource type!')
    if (!dir && o.resolvedDir) dir = join(o.resolvedDir, 'mods')
    if (!id && o.resolvedId) id = o.resolvedId
    if ((!dir || !id) && o.selectedVersion) {
      id = await profilesStore.resolveVersion(o.selectedVersion)
      dir = join(VERSIONS_PATH, id, 'mods')
      o.resolvedDir = dirname(dir)
      o.resolvedId = id
    }
    if (!id) throw new Error('No suck version: ' + o.selectedVersion)
    await fs.ensureDir(dir)
    const jsonPath = join(RESOURCES_VERSIONS_PATH, id, RESOURCES_MODS_INDEX_FILE_NAME)
    const old = o.oldResourceVersion ? o.oldResourceVersion.resources?.[r.id]
      : (await fs.readJson(jsonPath, { throws: false }) || { })[r.id]
    if (old) {
      if (gte(old.version, r.version)) return
      if (old.hashes) await Promise.all(old.hashes.map(it => fs.unlink(join(dir, it + '.jar')).catch(() => {})))
    }
    if (r.extends) await install(r.extends, false, true, T.isMod, o)
    const p = await makeTempDir()
    const urls: Array<{ url: string, file: string }> = r.urls.map((url, it) =>
      ({ url: replace(url, r), file: join(p, it.toString()) }))
    try {
      const hashes = await downloadAndCheckHash(urls, r)
      await pAll(urls.map((it, i) => () => {
        const path = join(dir, hashes[i] + '.jar')
        return fs.pathExists(path).then(t => t && fs.remove(path)).then(() => fs.move(it.file, path))
      }), { concurrency: 8 })
      if (!o.isolation) {
        const json = await fs.readJson(jsonPath, { throws: false }) || { }
        r.hashes = hashes
        json[r.id] = r
        await fs.outputJson(jsonPath, json)
      }
    } finally {
      await fs.remove(p).catch(console.error)
    }
  }

  public async installPlugin (r: T.ResourcePlugin, showDialog = false, o: T.InstallView = { }) {
    if (!r) return
    if (!T.isPlugin(r)) throw new TypeError('Incorrect resource type!')
    const old: T.ResourcePlugin = (await fs.readJson(RESOURCES_PLUGINS_INDEX, { throws: false }) || { })[r.id]
    if (old) {
      if (gte(old.version, r.version)) return
      if (r.hash !== old.hash) {
        const deletes: string[] = await fs.readJson(DELETES_FILE, { throws: false }) || []
        deletes.push(join(PLUGINS_ROOT, old.hash + (old.extension || '.asar')))
        await fs.writeJson(DELETES_FILE, deletes)
      }
    }
    if (r.extension && !ALLOW_PLUGIN_EXTENSIONS.includes(r.extension)) {
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
      await download({ url: replace(r.url, r), file }, r.title || r.id)
      const hash = await checkHash(file, r.hash)
      await fs.ensureDir(PLUGINS_ROOT)
      const path = join(PLUGINS_ROOT, hash + (r.extension || '.asar'))
      if (await fs.pathExists(path)) await fs.unlink(path)
      await fs.move(file, path)
      const json = await fs.readJson(RESOURCES_PLUGINS_INDEX, { throws: false }) || { }
      json[r.id] = r
      await fs.outputJson(RESOURCES_PLUGINS_INDEX, json)
    } finally {
      await fs.remove(p).catch(console.error)
    }
  }
}
