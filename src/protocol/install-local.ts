import { open, CachedZipFile, Entry } from '@xmcl/unzip'
import { join } from 'path'
import { VERSIONS_PATH, RESOURCE_PACKS_PATH } from '../constants'
import * as T from './types'
import fs from 'fs-extra'
import install from './install'
import versionSelector from '../components/VersionSelector'
import { sha1 } from '../utils'

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
        if (!await global.__requestInstallResources(json, o)) return
        versionDir = join(VERSIONS_PATH, await profilesStore.resolveVersion(o.selectedVersion))
      }
      if (!versionDir) return
      await installResource(zip, join(versionDir, 'mods'), json, zip.entries['files/' + json.hash], json.id + '.jar')
      break
    }
    case 'ResourcePack': {
      if (!versionDir && !await global.__requestInstallResources(json)) return
      await installResource(zip, RESOURCE_PACKS_PATH, json, zip.entries['files/' + json.hash], json.id + '.zip')
      break
    }
  }
}

export default async (path: string) => {
  if (!path.endsWith('.zip')) throw new Error($('Illegal resource type!'))
  const zip = await open(path)
  let file = zip.entries['local-resource.json']
  if (file) {
    const str = (await zip.readEntry(file)).toString()
    if (!str) throw new Error($('Illegal resource type!'))
    await installResources(zip, JSON.parse(str))
    zip.close()
    return
  }
  file = zip.entries['local-resources.json']
  let resources: Array<T.ResourceMod | T.ResourceResourcePack>
  if (file) {
    const str = (await zip.readEntry(file)).toString()
    if (!str) return
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
    return
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
    return
  }
  throw new Error($('No resources found!'))
}
