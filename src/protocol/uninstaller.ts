import fs from 'fs-extra'
import { shell } from 'electron'
import { join, basename } from 'path'
import { RESOURCES_VERSIONS_INDEX_PATH, RESOURCES_VERSIONS_PATH, VERSIONS_PATH,
  RESOURCES_MODS_INDEX_FILE_NAME, RESOURCES_RESOURCE_PACKS_INDEX_PATH, RESOURCE_PACKS_PATH, DELETES_FILE, RESOURCES_PLUGINS_INDEX } from '../constants'
import { Plugin } from '../plugin/Plugin'
import { FILE } from '../plugin/index'

export const uninstallVersion = async (id: string) => {
  const resolvedId = await profilesStore.resolveVersion(id)
  const json = await fs.readJson(RESOURCES_VERSIONS_INDEX_PATH, { throws: false }) || { }
  if (resolvedId in json) {
    delete json[resolvedId]
    await fs.writeJson(RESOURCES_VERSIONS_INDEX_PATH, json)
  }
  if (id in profilesStore.profiles) {
    delete profilesStore.profiles[id]
    await profilesStore.saveLaunchProfileJson()
  }
  await fs.remove(join(RESOURCES_VERSIONS_PATH, resolvedId)).catch(() => {})
  await fs.remove(join(VERSIONS_PATH, resolvedId)).catch(console.error)
}

export const uninstallMod = async (version: string, id: string, directly = false) => {
  const dir = join(VERSIONS_PATH, version, 'mods')
  if (directly) {
    if (!shell.moveItemToTrash(join(dir, id))) throw new Error('Delete failed!')
  } else {
    const jsonPath = join(RESOURCES_VERSIONS_PATH, version, RESOURCES_MODS_INDEX_FILE_NAME)
    console.log(version, id, directly, jsonPath)
    const json = await fs.readJson(jsonPath, { throws: false }) || {}
    if (!Array.isArray(json[id]?.hashes)) return
    await Promise.all(json[id].hashes.map((it: string) => fs.unlink(join(dir, it + '.jar')).catch(() => {})))
    delete json[id]
    await fs.writeJson(jsonPath, json)
  }
}

export const uninstallResourcePack = async (id: string, directly = false) => {
  if (directly) {
    if (!shell.moveItemToTrash(join(RESOURCE_PACKS_PATH, id))) throw new Error('Delete failed!')
  } else {
    const json = await fs.readJson(RESOURCES_RESOURCE_PACKS_INDEX_PATH, { throws: false }) || {}
    if (!Array.isArray(json[id]?.hashes)) return
    await Promise.all(json[id].hashes.map((it: string) => fs.unlink(join(RESOURCE_PACKS_PATH, it + '.zip'))
      .catch(() => {})))
    delete json[id]
    await fs.writeJson(RESOURCES_RESOURCE_PACKS_INDEX_PATH, json)
  }
}

export const uninstallPlugin = async (p: Plugin) => {
  const deletes: string[] = await fs.readJson(DELETES_FILE, { throws: false }) || []
  if (!pluginMaster.isPluginUninstallable(p, deletes)) throw new Error('Plugin cannot be uninstalled!')
  pluginMaster.pluginFileMap[p.pluginInfo.id] = p[FILE]
  deletes.push(basename(p[FILE]))
  const json = await fs.readJson(RESOURCES_PLUGINS_INDEX, { throws: false }) || { }
  delete json[p.pluginInfo.id]
  await Promise.all([fs.writeJson(DELETES_FILE, deletes), fs.writeJson(RESOURCES_PLUGINS_INDEX, json)])
  return deletes
}
