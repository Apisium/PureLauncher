import { sha1, genId } from '../utils'
import { join, basename } from 'path'
import { open, CachedZipFile, Entry } from '@xmcl/unzip/index'
import { VERSIONS_PATH, RESOURCE_PACKS_PATH, WORLDS_PATH, SHADER_PACKS_PATH, GAME_ROOT } from '../constants'
import { plugins } from '../plugin/internal/index'
import * as T from './types'
import fs from 'fs-extra'
import install from './install'
import versionSelector from '../components/VersionSelector'
import history from '../utils/history'

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
    case 'Server': {
      if (!versionDir && !await global.__requestInstallResources(json)) break
      await plugins.resourceInstaller.installServer(json)
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
      text: $(
        'The file type has been dragged in is {0}. Do you want to install it?',
        $('resource pack')
      )
    })) {
      zip.close()
      await fs.ensureDir(RESOURCE_PACKS_PATH)
      await fs.copyFile(path, join(RESOURCE_PACKS_PATH, basename(path)))
      return true
    }
  }
  return false
}

export const installShaderPack = async (path: string, zip?: CachedZipFile) => {
  if (!zip) zip = await open(path)
  console.log(Object.keys(zip.entries))
  if ('shaders/' in zip.entries) {
    if (await openConfirmDialog({
      cancelButton: true,
      text: $(
        'The file type has been dragged in is {0}. Do you want to install it?',
        $('shader pack')
      )
    })) {
      zip.close()
      await fs.ensureDir(SHADER_PACKS_PATH)
      await fs.copyFile(path, join(SHADER_PACKS_PATH, basename(path)))
      return true
    }
  }
  return false
}

export const installMod = async (path: string) => {
  const obj = { selectedVersion: '' }
  if (await openConfirmDialog({
    cancelButton: true,
    text: $('The file type has been dragged in is {0}. Do you want to install it?', $('mod')),
    component: versionSelector(obj, profilesStore)
  })) {
    let id = obj.selectedVersion
    if (!id || !(id = await profilesStore.resolveVersion(id))) throw new Error('No such version: ' + id)
    const dir = join(VERSIONS_PATH, id, 'mods')
    await fs.ensureDir(dir)
    const p2 = join(dir, basename(path))
    await fs.copyFile(path, p2)
    return true
  }
  return false
}

export const installWorld = async (zip: CachedZipFile) => {
  const file = Object.keys(zip.entries).find(it => it.includes('/level.dat'))
  if (!file) return false
  let dir = file.slice(0, -10)
  if (dir.includes('/')) return false
  if (!await openConfirmDialog({
    cancelButton: true,
    text: $(
      'The file type has been dragged in is {0}. Do you want to install it?',
      $('world') + ' (' + dir + ')'
    )
  })) return false
  const dest = join(WORLDS_PATH, dir)
  dir += '/'
  await zip.extractEntries(await fs.pathExists(dest) ? dest + '-' + genId() : dest, {
    entryHandler: (_, entry) => entry.fileName.startsWith(dir) ? entry.fileName.slice(dir.length) : null
  })
  return true
}

export default async (path: string, autoInstallOthers = false, emitEvent = false) => {
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
  let resources: Array<T.ResourceMod | T.ResourceResourcePack | T.ResourceServer>
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
  if (autoInstallOthers && (await installResourcePack(path, zip) || await installWorld(zip) ||
    await installShaderPack(path, zip))) return true
  if (!emitEvent) return false
  await pluginMaster.emitSync('zipDragIn', zip, path)
  return true
}

pluginMaster.on('fileDragIn', async (file: File) => {
  const { path } = file
  if (file.type || file.name !== '.minecraft' || await fs.stat(path).then(it => !it.isDirectory(), () => true) ||
    !await openConfirmDialog({
      cancelButton: true,
      text: $('The .minecraft folder has been dragged in. Do you need to import all versions, resource packages, mods and other files?')
    })) return
  notice({ content: $('Installing resources...') })
  try {
    await fs.copy(path, GAME_ROOT, { overwrite: false })
    notice({ content: $('Success!') })
    if ((await fs.readdir(join(path, 'versions')).catch(() => null))?.length && await openConfirmDialog({
      cancelButton: true,
      text: $('After importing, you still need to add the game version manually. Click OK to add.')
    })) {
      history.push('/manager/versions')
      setTimeout(() => (window as any).__setVersionAddDialogOpen?.(), 300)
    }
  } catch (e) {
    console.error(e)
    notice({ content: e ? e.message : $('Failed!'), error: true })
  }
})
