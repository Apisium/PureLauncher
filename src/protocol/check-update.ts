import fs from 'fs-extra'
import install from './install'
import gt from 'semver/functions/gt'
import analytics from '../utils/analytics'
import major from 'semver/functions/major'
import requestReload from '../utils/request-reload'
import P from '../models/index'
import GameStore, { STATUS } from '../models/GameStore'
import * as T from './types'
import { join } from 'path'
import { spawn } from 'child_process'
import { version } from '../../package.json'
import { remote, ipcRenderer, shell } from 'electron'
import { getJson, download, genId } from '../utils/index'
import { RESOURCES_VERSIONS_INDEX_PATH, RESOURCES_MODS_INDEX_FILE_NAME, ENTRY_POINT_PATH,
  RESOURCES_VERSIONS_PATH, ASAR_PATH, RESOURCES_RESOURCE_PACKS_INDEX_PATH, RESOURCES_PLUGINS_INDEX,
  LATEST_MANIFEST_URL, LAUNCHER_MANIFEST_URL, TEMP_PATH, DEFAULT_LOCATE } from '../constants'

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
  let needReload = false
  await Promise.all(Object.values(list).filter(it => it.updateUrl).map(it => {
    const obj: T.InstallView = { }
    install(it.updateUrl, false, false, r => T.isPlugin(r) && r.id === it.id, obj)
      .then(() => !obj.noDependency && (needReload = true))
  }))
  if (needReload) requestReload()
}

let downloaded = ''
export const updateLauncher = async () => {
  const json = await getJson(LATEST_MANIFEST_URL)
  if (!gt(json.version, version)) return
  const data = await getJson(LAUNCHER_MANIFEST_URL)
  if (major(json.version) === major(version)) {
    const destination = join(TEMP_PATH, genId())
    await download({
      destination,
      url: data.asar[+(DEFAULT_LOCATE !== 'zh-cn')].replace(/{version}/g, json.version),
      checksum: { algorithm: 'sha1', hash: json.asar }
    }, $('Update Package'), `PureLauncher-${json.version}.asar`)
    await fs.ensureDir(ASAR_PATH)
    const file = json.version + '.asar'
    await fs.move(destination, join(ASAR_PATH, file))
    await fs.writeJson(ENTRY_POINT_PATH, { file: json.version + '.asar' })
    analytics.event('update', 'asar')
    requestReload(true)
  } else {
    if (process.platform === 'win32') {
      if (!downloaded) {
        downloaded = join(TEMP_PATH, `PureLauncher-${json.version}-${genId()}.exe`)
        await download({
          destination: downloaded,
          url: data.asar[+(DEFAULT_LOCATE !== 'zh-cn')].replace(/{version}/g, json.version),
          checksum: { algorithm: 'sha1', hash: json.asar }
        }, $('Update Package'), `PureLauncher-${json.version}.exe`)
        localStorage.removeItem('updateCheckTime')
        const enrtyPoint = await fs.readJson(ENTRY_POINT_PATH, { throws: false }) || { }
        enrtyPoint.version = json.version
        await fs.writeJson(ENTRY_POINT_PATH, enrtyPoint)
      }
      if (P.getStore(GameStore).status === STATUS.READY) {
        notice({ content: $('A new version has been released, PureLauncher will restart in five seconds for installation.') })
        setTimeout(() => {
          spawn(downloaded, ['--updated'], { detached: true, stdio: 'ignore' }).once('error', console.error).unref()
          remote.app.exit()
        }, 5000)
      } else {
        openConfirmDialog({ text: $('A new version has been released, but the game is running now. Please manually exit the launcher and game to upgrade.') })
        ipcRenderer.send('run-before-quit', downloaded, ['--updated'], { detached: true, stdio: 'ignore' })
      }
    } else if (await openConfirmDialog({
      text: $('A new version has been released, but the current system does not support automatic update. Please install the new version manually and click OK to enter the download page.')
    })) shell.openExternal('https://pl.apisium.cn')
  }
}

export const update = async () => {
  if (!navigator.onLine) return
  localStorage.setItem('updateCheckTime', Date.now().toString())
  await Promise.all([updateLauncher().catch(e => {
    console.error(e)
    localStorage.removeItem('updateCheckTime')
    notice({ content: $('Update failed') + (e?.message ? ': ' + e.message : '') })
  }), updatePlugins().catch(console.error)])
}
