import { join } from 'path'
import { ensureDirSync } from 'fs-extra'
import { remote } from 'electron'

export const APP_ROOT = remote.app.getAppPath()
export const UNPACKED_PATH = join(APP_ROOT, 'unpacked')
export const MC_LOGO_PATH = join(UNPACKED_PATH, 'mc-logo.ico')
export const GAME_ROOT = join(process.platform === 'linux' ? remote.app.getPath('home') : remote.app.getPath('appData'),
  process.platform === 'darwin' ? 'minecraft' : '.minecraft')
export const APP_PATH = remote.app.getPath('userData')
export const TEMP_PATH = remote.app.getPath('temp')
export const SKINS_PATH = join(APP_PATH, 'skins')
export const PLUGINS_ROOT = join(APP_PATH, 'plugins')
export const DELETES_FILE = join(PLUGINS_ROOT, 'deletes.json')
export const OFFLINE_ACCOUNTS_FILE = join(APP_PATH, 'offline.json')
export const UPDATES_PATH = join(APP_PATH, 'updates')
export const ASAR_PATH = join(UPDATES_PATH, 'asar')
export const ENTRY_POINT_PATH = join(UPDATES_PATH, 'entry-point.json')
ensureDirSync(SKINS_PATH, 1)

export const LAUNCH_PROFILE_FILE_NAME = 'launcher_profiles.json'
export const LAUNCH_PROFILE_PATH = join(GAME_ROOT, LAUNCH_PROFILE_FILE_NAME)
export const EXTRA_CONFIG_FILE_NAME = 'config.json'
export const EXTRA_CONFIG_PATH = join(APP_PATH, EXTRA_CONFIG_FILE_NAME)
export const MODS_PATH = join(GAME_ROOT, 'mods')
export const WORLDS_PATH = join(GAME_ROOT, 'saves')
export const VERSIONS_PATH = join(GAME_ROOT, 'versions')
export const RESOURCE_PACKS_PATH = join(GAME_ROOT, 'resourcepacks')
export const LIBRARIES_PATH = join(GAME_ROOT, 'libraries')
export const SHADER_PACKS_PATH = join(GAME_ROOT, 'shaderpacks')
export const SERVERS_FILE_NAME = 'servers.dat'
export const SERVERS_PATH = join(GAME_ROOT, SERVERS_FILE_NAME)

export const RESOURCES_PATH = join(APP_PATH, 'resources')
export const RESOURCES_VERSIONS_PATH = join(RESOURCES_PATH, 'versions')
export const RESOURCES_VERSIONS_INDEX_PATH = join(RESOURCES_PATH, 'versions-index.json')
export const RESOURCES_WORLDS_INDEX_PATH = join(RESOURCES_PATH, 'worlds-index.json')
export const RESOURCES_RESOURCE_PACKS_INDEX_PATH = join(RESOURCES_PATH, 'resource-packs-index.json')
export const RESOURCES_PLUGINS_INDEX = join(RESOURCES_PATH, 'plugins-index.json')
export const RESOURCES_MODS_INDEX_FILE_NAME = 'mods-index.json'

export const DEFAULT_EXT_FILTER = ['exe', 'com']
export const ALLOW_PLUGIN_EXTENSIONS = ['.js', '.mjs', '.asar']

export const DEFAULT_LOCATE = (navigator.languages[0] || 'zh-cn').toLowerCase()
export const IS_WINDOWS = process.platform === 'win32'

export const LAUNCHING_IMAGE = join(APP_PATH, 'launching.webp')
export const DOWNLOAD_EXE_URL = 'https://dl.pl.apisium.cn/PureLauncher.exe'
export const DOWNLOAD_ASAR_URL = 'https://dl.pl.apisium.cn/app.asar'
export const LATEST_URL = 'https://dl.pl.apisium.cn/latest.json'
export const LAUNCHER_MANIFEST_URL = 'https://r.pl.apisium.cn/manifest.json'
export const NEWS_URL = 'https://s.pl.apisium.cn/news.json'
