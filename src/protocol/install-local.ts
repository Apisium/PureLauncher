import { sha1 } from '../utils'
import { join, basename } from 'path'
import { open, CachedZipFile, Entry } from '@xmcl/unzip'
import { VERSIONS_PATH, RESOURCE_PACKS_PATH } from '../constants'
import * as T from './types'
import fs from 'fs-extra'
import install from './install'
import versionSelector from '../components/VersionSelector'

const installResource = async (zip: CachedZipFile, dir: string, json: any, entry: Entry, name: string) => {
  if (!entry || !json.hash || !name || name.includes('/') || name.includes('\\')) {
    throw new Error($('Illegal resource type!'))
  }
  const file = join(dir, name)
  await fs.outputFile(file, await zip.readEntry(entry))
  const hash = await sha1(file)
  if (json.hash !== hash) throw new Error($('Hash is different: {0} -> {1}', json.hash, hash))
}
const installResources = async (zip: CachedZipFile, json: any, versionDir?: string) => {
  switch (json.type) {
    case 'Mod': {
      if (!versionDir) {
        const o: T.InstallView = { request: true, throws: true }
        o.render = versionSelector(o)
        if (!await global.__requestInstallResources(json, o)) break
        versionDir = join(VERSIONS_PATH, await profilesStore.resolveVersion(o.selectedVersion))
      }
      if (!versionDir) return
      await installResource(zip, join(versionDir, 'mods'), json, zip.entries['files/' + json.hash], json.id + '.jar')
      return true
    }
    case 'ResourcePack': {
      if (!versionDir && !await global.__requestInstallResources(json)) break
      await installResource(zip, RESOURCE_PACKS_PATH, json, zip.entries['files/' + json.hash], json.id + '.zip')
      return true
    }
  }
  return false
}

export const installResourcePack = async (path: string, zip?: CachedZipFile) => {
  if (!zip) zip = await open(path)
  if ('pack.mcmeta' in zip.entries) {
    if (await openConfirmDialog({
      cancelButton: true,
      text: $('It has been detected that the file type dragged in is resource package. Do you want to install it?')
    })) {
      zip.close()
      await fs.ensureDir(RESOURCE_PACKS_PATH)
      await fs.copyFile(path, join(RESOURCE_PACKS_PATH, basename(path)))
      return true
    }
  }
  return false
}

export const installMod = async (path: string) => {
  const obj = { selectedVersion: '' }
  if (await openConfirmDialog({
    cancelButton: true,
    text: $('It has been detected that the file type dragged in is mod. Do you want to install it?'),
    component: versionSelector(obj, profilesStore)
  })) {
    let id = obj.selectedVersion
    if (!id || !(id = await profilesStore.resolveVersion(id))) throw new Error('No such version: ' + id)
    const dir = join(VERSIONS_PATH, id, 'mods')
    await fs.ensureDir(dir)
    const p2 = join(dir, basename(path))
    console.log(path, p2)
    await fs.copyFile(path, p2)
    return true
  }
  return false
}

export default async (path: string, autoInstallResourcePack = false, emitEvent = false) => {
  if (!path.endsWith('.zip')) throw new Error($('Illegal resource type!'))
  const zip = await open(path)
  let file = zip.entries['local-resource.json']
  if (file) {
    const str = (await zip.readEntry(file)).toString()
    if (!str) throw new Error($('Illegal resource type!'))
    const ret = await installResources(zip, JSON.parse(str))
    zip.close()
    return ret
  }
  file = zip.entries['local-resources.json']
  let resources: Array<T.ResourceMod | T.ResourceResourcePack>
  if (file) {
    const str = (await zip.readEntry(file)).toString()
    if (!str) throw new Error($('Illegal resource type!'))
    resources = (JSON.parse(str) as T.AllResources[])
      .filter(it => typeof it === 'object' && it.id && (it as any).hash) as any
  }
  file = zip.entries['resource-manifest']
  if (file) {
    const str = (await zip.readEntry(file)).toString()
    const o: T.InstallView = { }
    if (str) await install(str, true, true, undefined, o).catch(console.error)
    if (o.type === 'Version' && o.resolveDir) {
      await Promise.all(resources.map(it => installResources(zip, it, o.resolvedDir)))
    }
    zip.close()
    return true
  }
  file = zip.entries['resource-manifest.json']
  if (file) {
    const str = (await zip.readEntry(file)).toString()
    const o: T.InstallView = { }
    if (str) await install(JSON.parse(str), true, true, undefined, o).catch(console.error)
    if (o.type === 'Version' && o.resolveDir) {
      await Promise.all(resources.map(it => installResources(zip, it, o.resolvedDir)))
    }
    zip.close()
    return true
  }
  if (autoInstallResourcePack && await installResourcePack(path, zip)) return true
  if (!emitEvent) return false
  await pluginMaster.emitSync('zipDragIn', zip, path)
  return true
}
