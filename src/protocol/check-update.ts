import fs from 'fs-extra'
import install from './install'
import requestReload from '../utils/request-reload'
import * as T from './types'
import { join } from 'path'
import { RESOURCES_VERSIONS_INDEX_PATH, RESOURCES_MODS_INDEX_FILE_NAME, RESOURCES_VERSIONS_PATH,
  RESOURCES_RESOURCE_PACKS_INDEX_PATH, RESOURCES_PLUGINS_INDEX, DELETES_FILE } from '../constants'

export default async (version: string) => {
  const json: T.ResourceVersion = (await fs.readJson(RESOURCES_VERSIONS_INDEX_PATH, { throws: false }) || { })[version]
  if (json && json.updateUrl) await install(json.updateUrl, false, true, it => T.isVersion(it) && it.id === json.id)
  await Promise.all(Object.values(await fs.readJson(
    join(RESOURCES_VERSIONS_PATH, version, RESOURCES_MODS_INDEX_FILE_NAME),
    { throws: false }) || { }).map((it: any) => it.updateUrl &&
      install(it.updateUrl, false, true, m => T.isMod(m) && m.id === it.id)).filter(Boolean))
  await Promise.all(Object.values(await fs.readJson(RESOURCES_RESOURCE_PACKS_INDEX_PATH,
    { throws: false }) || { }).map((it: any) => it.updateUrl &&
      install(it.updateUrl, false, true, m => T.isResource(m) && m.id === it.id)).filter(Boolean))
  return json
}

export const updatePlugins = async () => {
  const list: Record<string, T.ResourcePlugin> = await fs.readJson(RESOURCES_PLUGINS_INDEX) || { }
  await Promise.all(Object.values(list).filter(it => it.updateUrl).map(it => install(it.updateUrl, false, false,
    r => T.isPlugin(r) && r.id === it.id)))
  const json = await fs.readJson(DELETES_FILE, { throws: false })
  if (Array.isArray(json) && json.length) requestReload()
}
