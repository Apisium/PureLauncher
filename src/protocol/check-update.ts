import fs from 'fs-extra'
import install from './install'
import joinUrl from 'url-join'
import gt from 'semver/functions/gt'
import analytics from '../utils/analytics'
import major from 'semver/functions/major'
import requestReload from '../utils/request-reload'
import P from '../models/index'
import GameStore, { STATUS } from '../models/GameStore'
import * as T from './types'
import { join } from 'path'
import { move } from '../utils/fs'
import { spawn } from 'child_process'
import { version } from '../../package.json'
import { shell } from 'electron'
import { getJson, download, genId } from '../utils/index'
import { RESOURCES_VERSIONS_INDEX_PATH, RESOURCES_MODS_INDEX_FILE_NAME, ENTRY_POINT_PATH,
  RESOURCES_VERSIONS_PATH, ASAR_PATH, RESOURCES_RESOURCE_PACKS_INDEX_PATH, RESOURCES_PLUGINS_INDEX,
  LATEST_URL, TEMP_PATH, DOWNLOAD_ASAR_URL, DOWNLOAD_EXE_URL, IS_WINDOWS, APP_ROOT } from '../constants'

export default async (version: string) => {
  const json: T.ResourceVersion = (await fs.readJson(RESOURCES_VERSIONS_INDEX_PATH, { throws: false }) || { })[version]
  if (!navigator.onLine) return json
  if (json && json.updateUrl) await install(json.updateUrl, false, false, it => T.isVersion(it) && it.id === json.id)
  await Promise.all(Object.values(await fs.readJson(
    join(RESOURCES_VERSIONS_PATH, version, RESOURCES_MODS_INDEX_FILE_NAME),
    { throws: false }) || { }).map((it: any) => it.updateUrl &&
      install(it.updateUrl, false, false, m => T.isMod(m) && m.id === it.id)).filter(Boolean))
  await Promise.all(Object.values(await fs.readJson(RESOURCES_RESOURCE_PACKS_INDEX_PATH,
    { throws: false }) || { }).map((it: any) => it.updateUrl &&
      install(it.updateUrl, false, false, m => T.isResource(m) && m.id === it.id)).filter(Boolean))
  return json
}

export const updatePlugins = async () => {
  const list: Record<string, T.ResourcePlugin> = await fs.readJson(RESOURCES_PLUGINS_INDEX, { throws: false }) || { }
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
  if (__DEV__) return
  const json = await getJson(joinUrl(LATEST_URL))
  if (!gt(json.version, version)) return
  if (major(json.version) === major(version)) {
    const destination = join(TEMP_PATH, genId())
    await download({
      destination,
      url: DOWNLOAD_ASAR_URL,
      checksum: { algorithm: 'sha1', hash: json.asar }
    }, $('Update Package'), `PureLauncher-${json.version}.asar`)
    await fs.ensureDir(ASAR_PATH)
    const file = json.version + '.asar'
    await move(destination, join(ASAR_PATH, file))
    await fs.writeJson(ENTRY_POINT_PATH, { file: json.version + '.asar', version: json.version })
    analytics.event('update', 'asar', version)
    requestReload(true)
  } else {
    if (IS_WINDOWS) {
      if (!downloaded) {
        downloaded = join(TEMP_PATH, `PureLauncher-${json.version}-${genId()}.exe`)
        await download({
          destination: downloaded,
          url: DOWNLOAD_EXE_URL,
          checksum: { algorithm: 'sha1', hash: json.exe }
        }, $('Update Package'), `PureLauncher-${json.version}.exe`)
        localStorage.removeItem('updateCheckTime')
        const enrtyPoint = await fs.readJson(ENTRY_POINT_PATH, { throws: false }) || { }
        enrtyPoint.version = json.version
        await fs.writeJson(ENTRY_POINT_PATH, enrtyPoint)
      }
      const elevate = join(APP_ROOT, 'resources/elevate.exe')
      if (await fs.pathExists(elevate)) {
        if (P.getStore(GameStore).status === STATUS.READY) {
          notice({ content: $('A new version has been released, PureLauncher will restart in five seconds for installation.') })
          setTimeout(() => {
            spawn(elevate, [downloaded], { detached: true, stdio: 'ignore' })
              .once('error', console.error).unref()
            window.quitApp()
          }, 10000)
        } else {
          openConfirmDialog({ text: $('A new version has been released, but the game is running now. Please manually exit the launcher and game to upgrade.') })
          spawn(elevate, [downloaded], { detached: true, stdio: 'ignore' })
            .once('error', console.error).unref()
        }
      } else {
        await openConfirmDialog({ text: $('Please run the installer manually to update PureLauncher!') })
        shell.showItemInFolder(downloaded)
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
