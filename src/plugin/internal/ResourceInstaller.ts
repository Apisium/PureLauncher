import { join, dirname, resolve } from 'path'
import { version } from '../../../package.json'
import { plugin, Plugin, event } from '../Plugin'
import { DownloadOption } from '@xmcl/installer/index'
import { serialize, deserialize, TagType } from '@xmcl/nbt/index'
import { makeTempDir, getJson, sha1, genId, validPath, replace, download, unzip } from '../../utils/index'
import { VERSIONS_PATH, RESOURCE_PACKS_PATH, RESOURCES_VERSIONS_PATH, RESOURCES_VERSIONS_INDEX_PATH, WORLDS_PATH,
  PLUGINS_ROOT, RESOURCES_RESOURCE_PACKS_INDEX_PATH, RESOURCES_PLUGINS_INDEX, SERVERS_PATH, SERVERS_FILE_NAME,
  RESOURCES_MODS_INDEX_FILE_NAME, DELETES_FILE, ALLOW_PLUGIN_EXTENSIONS, TEMP_PATH,
  LAUNCHER_MANIFEST_URL } from '../../constants'
import pAll from 'p-all'
import fs from 'fs-extra'
import gte from 'semver/functions/gte'
import install from '../../protocol/install'
import versionSelector from '../../components/VersionSelector'
import * as T from '../../protocol/types'
import * as ofs from '../../utils/fs'

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

interface DownloadAndMoveOption extends DownloadOption {
  moveTo: string
}

const downloadAndGetHash = (options: DownloadOption | DownloadOption[]) => download(options).then(() => {
  const files = Array.isArray(options) ? options : [options]
  return files[0]?.checksum ? undefined : pAll(files.map(it => () => sha1(it.destination)), { concurrency: 8 })
})

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
      case 'World':
        await this.installWorld(r, o)
    }
  }

  public async installWorld (r: T.ResourceWorld, o: T.InstallView = { }) {
    if (!T.isWorld(r)) throw new TypeError($('Illegal resource type!'))
    const dir = o.isolation ? join(VERSIONS_PATH, o.resolvedId, 'worlds') : WORLDS_PATH
    // const old: T.ResourceWorld = o.oldResourceVersion ? o.oldResourceVersion.resources?.[r.id]
    //   : (await fs.readJson(RESOURCES_WORLDS_INDEX_PATH, { throws: false }) || { })[r.id]
    // if (old) {
    // if (gte(old.version, r.version)) return
    // if (old.h) await Promise.all(old.hashes.map(it => fs.unlink(join(dir, it + '.zip')).catch(() => {})))
    // }
    const destination = join(TEMP_PATH, genId())
    try {
      await download({
        destination,
        url: replace(r.url, r),
        checksum: r.hash ? { algorithm: 'sha1', hash: r.hash } : undefined
      })
      await fs.ensureDir(dir)
      await unzip(destination, dir, { replaceExisted: true })
      // if (!o.isolation) {
      //   const json = await fs.readJson(RESOURCES_WORLDS_INDEX_PATH, { throws: false }) || { }
      //   r.hash = hash
      //   json[r.id] = r
      //   await fs.outputJson(RESOURCES_WORLDS_INDEX_PATH, json)
      // }
    } finally {
      await fs.remove(destination).catch(console.error)
    }
  }

  public async installServer (r: T.ResourceServer, o: T.InstallView = { }) {
    if (!T.isServer(r)) throw new TypeError($('Illegal resource type!'))
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
    if (!T.isVersion(r)) throw new TypeError($('Illegal resource type!'))
    const ar: any = r
    const id = ar.resolvedId = T.resolveVersionId(r)
    const dir = resolve(VERSIONS_PATH, id)
    const old: T.ResourceVersion = (await fs.readJson(RESOURCES_VERSIONS_INDEX_PATH, { throws: false }) || { })[r.id]
    const jsonPath = join(dir, id + '.json')
    const installResources = !o.versionResources
    if (installResources) o.versionResources = {}
    if (typeof r.resources === 'object') Object.assign(o.versionResources, r.extends)
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
        if (r.hashes && r.hashes.length !== arr.length) {
          throw new Error($('The number of files is not equal to the number of hashes provided!'))
        }
        const options: DownloadAndMoveOption[] = arr.map(([name, url], i) => ({
          url: replace(url, r),
          destination: join(p, i.toString()),
          moveTo: validPath(dir, replace(name, r)),
          checksum: r.hashes ? { algorithm: 'sha1', hash: r.hashes[i] } : undefined
        }))
        const hashes = await downloadAndGetHash(options) || r.hashes
        await pAll(options.map(it => () => {
          const path = it.moveTo
          return fs.pathExists(path).then(t => t && fs.remove(path)).then(() => ofs.move(it.destination, path))
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
        if (r.extends) json.inhertFrom = obj.resolvedId
        o.resolvedId = json.id = id
        await pluginMaster.emitSync('processResourceVersionJson', json)
        await fs.writeJson(jsonPath, json)
      }
      if (r.isolation) o.isolation = true
      if (installResources) {
        await pAll(Object.values(o.versionResources as Record<string, T.Resource>).map(it => () =>
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
    if (!T.isResourcePack(r)) throw new TypeError($('Illegal resource type!'))
    if (r.hashes && r.hashes.length !== r.urls.length) {
      throw new Error($('The number of files is not equal to the number of hashes provided!'))
    }
    const dir = o.isolation ? join(VERSIONS_PATH, o.resolvedId, 'resourcepacks') : RESOURCE_PACKS_PATH
    const old: T.ResourceResourcePack = o.oldResourceVersion ? o.oldResourceVersion.resources?.[r.id]
      : (await fs.readJson(RESOURCES_RESOURCE_PACKS_INDEX_PATH, { throws: false }) || { })[r.id]
    if (old) {
      if (gte(old.version, r.version)) return
      if (old.hashes) await Promise.all(old.hashes.map(it => fs.unlink(join(dir, it + '.zip')).catch(() => {})))
    }
    if (typeof r.extends === 'object' && !Array.isArray(r.extends)) {
      for (const key in r.extends) {
        await install(r.extends[key], false, true, T.isResourcePack, {
          resolvedId: o.resolvedId,
          oldResourceVersion: o.oldResourceVersion,
          isolation: o.isolation
        })
      }
    }
    const p = await makeTempDir()
    const urls: DownloadOption[] = r.urls.map((url, i) => ({
      url: replace(url, r),
      destination: join(p, i.toString()),
      checksum: r.hashes ? { algorithm: 'sha1', hash: r.hashes[i] } : undefined
    }))
    try {
      const hashes = await downloadAndGetHash(urls) || r.hashes
      await fs.ensureDir(dir)
      await pAll(urls.map((it, i) => () => {
        const path = join(dir, hashes[i] + '.zip')
        return fs.pathExists(path).then(t => t && fs.unlink(path)).then(() => fs.move(it.destination, path))
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
    if (!T.isMod(r)) throw new TypeError($('Illegal resource type!'))
    if (r.hashes && r.hashes.length !== r.urls.length) {
      throw new Error($('The number of files is not equal to the number of hashes provided!'))
    }
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
    if (typeof r.extends === 'object' && !Array.isArray(r.extends)) {
      for (const key in r.extends) {
        await install(r.extends[key], false, true, T.isMod, {
          resolvedId: o.resolvedId,
          resolvedDir: o.resolvedDir,
          oldResourceVersion: o.oldResourceVersion,
          isolation: o.isolation
        })
      }
    }
    const p = await makeTempDir()
    const urls: DownloadOption[] = r.urls.map((url, i) => ({
      url: replace(url, r),
      destination: join(p, i.toString()),
      checksum: r.hashes ? { algorithm: 'sha1', hash: r.hashes[i] } : undefined
    }))
    try {
      const hashes = await downloadAndGetHash(urls) || r.hashes
      await pAll(urls.map((it, i) => () => {
        const path = join(dir, hashes[i] + '.jar')
        return fs.pathExists(path).then(t => t && fs.remove(path)).then(() => fs.move(it.destination, path))
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
    if (!T.isPlugin(r)) throw new TypeError($('Illegal resource type!'))
    const old: T.ResourcePlugin = (await fs.readJson(RESOURCES_PLUGINS_INDEX, { throws: false }) || { })[r.id]
    if (old) {
      if (gte(old.version, r.version)) return
      if (r.hash !== old.hash) {
        const deletes: string[] = await fs.readJson(DELETES_FILE, { throws: false }) || []
        deletes.push(old.hash + (old.extension || '.asar'))
        await fs.writeJson(DELETES_FILE, deletes)
      }
    }
    if (r.extension && !ALLOW_PLUGIN_EXTENSIONS.includes(r.extension)) {
      throw new Error(`The extension: ${r.extension} is not allowed`)
    }
    if (!o.safePluginHashes) o.safePluginHashes = (await getJson(LAUNCHER_MANIFEST_URL) || {}).pluginHashes
    if (!o.safePluginHashes.includes(r.hash) && !o.confirmed && showDialog && !await openConfirmDialog({
      cancelButton: true,
      text: $('Warning! Installing plugins, please confirm whether the plugin is safe! If the extension is a malicious plugin, it may cause damage to your computer!\n\nPlugin ID: {0}\nName: {1}',
        r.id, r.title || $('Unknown'))
    })) throw new Error('Canceled install plugin!')
    o.confirmed = true
    let noDependency = true
    if (typeof r.dependencies === 'object' && r.dependencies && Object.keys(r.dependencies).length) {
      noDependency = false
      await Promise.all(Object.values(r.dependencies).map(it => install(it, false, true, T.isPlugin, o)))
    }
    if (!('noDependency' in o)) o.noDependency = noDependency
    const file = join(TEMP_PATH, genId())
    try {
      await download({ url: replace(r.url, r), destination: file,
        checksum: { algorithm: 'sha1', hash: r.hash } }, r.title || r.id)
      await fs.ensureDir(PLUGINS_ROOT)
      const path = join(PLUGINS_ROOT, r.hash + (r.extension || '.asar'))
      console.log(file, path)
      if (await fs.pathExists(path)) await fs.unlink(path)
      await ofs.move(file, path)
      const json = await fs.readJson(RESOURCES_PLUGINS_INDEX, { throws: false }) || { }
      json[r.id] = r
      await fs.outputJson(RESOURCES_PLUGINS_INDEX, json)
      if (noDependency) pluginMaster.loadPluginFromPath(path)
    } finally {
      await fs.remove(file).catch(console.error)
    }
  }
}
