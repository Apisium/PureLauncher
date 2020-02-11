import { join } from 'path'
import { ensureDirSync } from 'fs-extra'
import { platform } from 'os'
import { remote } from 'electron'

const current = platform()
export const GAME_ROOT = join(current === 'linux' ? remote.app.getPath('home') : remote.app.getPath('appData'),
  current === 'darwin' ? 'minecraft' : '.minecraft')
export const APP_PATH = remote.app.getPath('userData')
export const SKINS_PATH = join(APP_PATH, 'skins')
export const PLUGINS_ROOT = join(APP_PATH, 'plugins')
export const DELETES_FILE = join(PLUGINS_ROOT, 'deletes.json')
export const OFFLINE_ACCOUNTS_FILE = join(APP_PATH, 'offline.json')
ensureDirSync(SKINS_PATH, 1)

export const LAUNCH_PROFILE_FILE_NAME = 'launcher_profiles.json'
export const LAUNCH_PROFILE_PATH = join(GAME_ROOT, LAUNCH_PROFILE_FILE_NAME)
export const VERSION_MANIFEST_PATH = join(GAME_ROOT, 'version_manifest.json')
export const EXTRA_CONFIG_FILE_NAME = 'config.json'
export const EXTRA_CONFIG_PATH = join(APP_PATH, EXTRA_CONFIG_FILE_NAME)
export const MODS_PATH = join(GAME_ROOT, 'mods')
export const VERSIONS_PATH = join(GAME_ROOT, 'versions')
export const RESOURCE_PACKS_PATH = join(GAME_ROOT, 'resourcepacks')

export const RESOURCES_PATH = join(APP_PATH, 'resources')
export const RESOURCES_VERSIONS_PATH = join(RESOURCES_PATH, 'versions')
export const RESOURCES_VERSIONS_INDEX_PATH = join(RESOURCES_PATH, 'versions-index.json')
export const RESOURCES_RESOURCE_PACKS_INDEX_PATH = join(RESOURCES_PATH, 'resource-packs-index.json')
export const RESOURCES_PLUGINS_INDEX = join(RESOURCES_PATH, 'plugins-index.json')
export const RESOURCES_MODS_INDEX_FILE_NAME = 'mods-index.json'

export const MC_LOGO = join(process.cwd(), 'unpacked/mc-logo.ico')

export const DEFAULT_EXT_FILTER = ['exe', 'com']
export const ALLOW_PLUGIN_EXTENSIONS = ['.js', '.mjs', '.asar']

export const DEFAULT_LOCATE = (navigator.languages[0] || 'zh-cn').toLowerCase()
