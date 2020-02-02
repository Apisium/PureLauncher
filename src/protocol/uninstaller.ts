import fs from 'fs-extra'
import { join } from 'path'
import { RESOURCES_VERSIONS_INDEX_PATH, RESOURCES_VERSIONS_PATH, VERSIONS_PATH,
  RESOURCES_MODS_INDEX_FILE_NAME } from '../constants'

export const uninstallVersion = async (id: string) => {
  const json = await fs.readJson(RESOURCES_VERSIONS_INDEX_PATH, { throws: false }) || { }
  if (id in json) {
    delete json[id]
    await fs.writeJson(RESOURCES_VERSIONS_INDEX_PATH, json)
  }
  const key = Object.entries(profilesStore.profiles).find(it => it[1].lastVersionId === id)
  if (key) {
    delete profilesStore.profiles[key[0]]
    await profilesStore.saveLaunchProfileJson()
  }
  await fs.remove(RESOURCES_VERSIONS_PATH).catch(() => {})
  await fs.remove(join(VERSIONS_PATH, id)).catch(() => {})
}

export const uninstallMod = async (version: string, id: string, directly = false) => {
  const dir = join(VERSIONS_PATH, version, 'mods')
  if (directly) await fs.unlink(join(dir, id)).catch(() => {})
  else {
    const jsonPath = join(RESOURCES_VERSIONS_PATH, version, RESOURCES_MODS_INDEX_FILE_NAME)
    const json = await fs.readJson(jsonPath, { throws: false }) || {}
    if (!Array.isArray(json[id]?.hashes)) return
    await Promise.all(json[id].hashes.map((it: string) => fs.unlink(join(dir, it + '.jar')).catch(() => {})))
    delete json[id]
    await fs.writeJson(jsonPath, json)
  }
}
