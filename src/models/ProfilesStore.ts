import { join } from 'path'
import { remote } from 'electron'
import { Store, NOT_PROXY } from 'reqwq'
import { YGGDRASIL } from '../plugin/logins'
import { langs, applyLocate } from '../i18n'
import { ResourceVersion } from '../protocol/types'
import { getJavaVersion, cacheSkin, genUUID, vertifyJava, openServerHome } from '../utils/index'
import { LAUNCH_PROFILE_PATH, EXTRA_CONFIG_PATH, MODS_PATH, LAUNCH_PROFILE_FILE_NAME,
  VERSIONS_PATH, MC_LOGO_PATH, IS_WINDOWS, GAME_ROOT, EXTRA_CONFIG_FILE_NAME,
  RESOURCES_VERSIONS_INDEX_PATH, APP_PATH, DEFAULT_LOCATE } from '../constants'
import fs from 'fs-extra'
import pAll from 'p-all'
import moment from 'moment'
import urlJoin from 'url-join'
import * as Auth from '../plugin/Authenticator'
import DownloadProviders, { DownloadProvider, downloader } from '../plugin/DownloadProviders'
import { VersionList } from '@xmcl/installer/minecraft'

const MINECRAFT_MANIFEST = 'minecraftManifest'
const MINECRAFT_MANIFEST_UPDATE_TIME = 'minecraftManifestUpdateTime'

const _downloader = Object.entries(DownloadProviders).filter(it => it[1]
  .locales?.some(l => DEFAULT_LOCATE.startsWith(l)))

export interface Version {
  name: string
  icon: string
  created: string
  lastUsed: string
  lastVersionId: string
  type: 'latest-snapshot' | 'latest-release' | 'custom'
}
interface User {
  accessToken: string
  username: string
  profiles: Record<string, { displayName: string }>
  properties: Array<Record<string, string>>
}
export default class ProfilesStore extends Store {
  public i = 0
  public settings = {
    enableSnapshots: false,
    locale: DEFAULT_LOCATE,
    showMenu: true,
    showGameLog: false
  }
  public selectedUser = {
    account: '',
    profile: ''
  }
  public profiles: Record<string, Version> = {}
  public authenticationDatabase: Record<string, User> = {}
  public clientToken = genUUID()
  public extraJson = {
    javaPath: '',
    memory: 0,
    animation: false,
    selectedUser: '',
    loginType: '',
    copyMode: false,
    noChecker: false,
    downloadThreads: 16,
    soundOn: true,
    fold: false,
    downloadProvider: (_downloader.find(it => it[1].preference) || _downloader[0])?.[0] || 'OFFICIAL',
    javaArgs: '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 ' +
      '-XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M -XX:-UseAdaptiveSizePolicy -XX:-OmitStackTraceInFastThrow'
  }
  public versionManifest: VersionList & { [NOT_PROXY]: true } = {
    [NOT_PROXY]: true,
    timestamp: '',
    versions: [],
    latest: {
      release: '',
      snapshot: ''
    }
  }

  public loginDialogVisible = false

  public get selectedVersion () {
    let version: Version
    let time = -Infinity
    let key = ''
    for (const k in this.profiles) {
      const v = this.profiles[k]
      const t = moment(v.lastUsed).valueOf()
      if (t > time && (this.settings.enableSnapshots || v.type !== 'latest-snapshot')) {
        key = k
        version = v
        time = t
      }
    }
    return { ...version, key }
  }

  public get sortedVersions () {
    if (!this.profiles) return []
    let arr = Object.entries(this.profiles)
    if (!this.settings.enableSnapshots) arr = arr.filter(([_, ver]) => ver.type !== 'latest-snapshot')
    return arr.map(([key, ver]) => ({ ...ver, key, lastUsed: moment(ver.lastUsed) }))
      .sort((a, b) => b.lastUsed.valueOf() - a.lastUsed.valueOf())
  }

  public get downloadProvider (): DownloadProvider {
    if (!this.extraJson) return DownloadProviders.OFFICIAL
    return DownloadProviders[this.extraJson.downloadProvider] || DownloadProviders.OFFICIAL
  }

  constructor () {
    super()
    try {
      this.loadLaunchProfileJson(fs.readJsonSync(LAUNCH_PROFILE_PATH))
    } catch (e) {
      this.onLoadLaunchProfileFailed(e)
    }

    try {
      this.loadExtraConfigJson(fs.readJsonSync(EXTRA_CONFIG_PATH))
    } catch (e) {
      this.onLoadExtraConfigFailed(e)
    }

    this.checkModsDirectory().catch(console.error)
    this.syncVersions().catch(console.error)
  }

  public getCurrentProfile () {
    if (!this.extraJson.loginType) return null
    try {
      if (this.extraJson.loginType === YGGDRASIL) {
        return this.selectedUser.account ? pluginMaster.logins[YGGDRASIL].getData(this.selectedUser.account) : null
      } else return pluginMaster.getCurrentLogin().getData(this.extraJson.selectedUser)
    } catch (e) {
      console.error(e)
      this.extraJson.loginType = ''
      this.extraJson.selectedUser = ''
      notice({ content: $('Current account is invalid, please re-login!') })
      this.saveExtraConfigJsonSync()
    }
  }

  public async cacheSkins () {
    const t = localStorage.getItem('skinCacheTime')
    if (t && parseInt(t, 10) + 24 * 60 * 60 * 1000 > Date.now()) return
    if (!await fetch('https://minotar.net/').then(it => it.ok).catch(() => false)) return
    await pAll(pluginMaster.getAllProfiles().filter(it => it.skinUrl)
      .map(it => () => cacheSkin(it)), { concurrency: 5 })
    localStorage.setItem('skinCacheTime', Date.now().toString())
    this.i++
  }

  public async setJavaPath () {
    const ret = await remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      title: $('Locate Java'),
      message: $('Locate the path of Java 8'),
      filters: [
        { name: $('Executable File (Javaw)'), extensions: IS_WINDOWS ? ['exe'] : [''] }
      ]
    })
    if (ret.canceled) {
      if (this.extraJson.javaPath && await openConfirmDialog({
        cancelButton: true,
        text: $('Do you need to reset the field and let the launcher automatically select the appropriate Java?')
      })) {
        this.extraJson.javaPath = ''
        notice({ content: $('Success!') })
      }
      return
    }
    notice({ content: $('Loading...') })
    const file = ret.filePaths[0]
    const version = await getJavaVersion(file, true)
    if (version) {
      if (!await vertifyJava(version, true)) return
      this.extraJson.javaPath = file
      this.saveExtraConfigJsonSync()
      const arches = JSON.parse(localStorage.getItem('javaArches') || '{}')
      arches[file] = version[1]
      localStorage.setItem('javaArches', JSON.stringify(arches))
      notice({ content: $('Success!') })
    } else notice({ content: $('Incorrect java version!'), error: true })
  }

  public async loadAllConfigs () {
    await fs.readJson(LAUNCH_PROFILE_PATH).then(j => this.loadLaunchProfileJson(j),
      e => this.onLoadLaunchProfileFailed(e))
    await fs.readJson(EXTRA_CONFIG_PATH).then(j => this.loadExtraConfigJson(j),
      e => this.onLoadExtraConfigFailed(e))
  }

  public saveLaunchProfileJsonSync () {
    // not throw but return a null
    const json = fs.readJsonSync(LAUNCH_PROFILE_PATH, { throws: false }) || {}

    fs.writeJsonSync(LAUNCH_PROFILE_PATH, {
      ...json,
      settings: { ...json.settings, ...this.settings },
      selectedUser: this.selectedUser,
      profiles: this.profiles,
      authenticationDatabase: this.authenticationDatabase,
      clientToken: this.clientToken
    })
  }

  public async resolveVersion (key: string) {
    const v = this.profiles[key]
    if (!v) throw new Error('No such version: ' + key)
    switch (v.type) {
      case 'latest-release':
        await this.ensureVersionManifest()
        return this.versionManifest.latest.release
      case 'latest-snapshot':
        await this.ensureVersionManifest()
        return this.versionManifest.latest.snapshot
      default: return v.lastVersionId
    }
  }

  public async saveLaunchProfileJson () {
    // not throw but return a null
    const json = await fs.readJson(LAUNCH_PROFILE_PATH, { throws: false }) || {}

    const data: Pick<this, 'settings' | 'selectedUser' | 'profiles' | 'authenticationDatabase' | 'clientToken'> = {
      ...json,
      settings: { ...json.settings, ...this.settings },
      selectedUser: this.selectedUser,
      profiles: this.profiles,
      authenticationDatabase: this.authenticationDatabase,
      clientToken: this.clientToken
    }
    await fs.writeJson(LAUNCH_PROFILE_PATH, data)
  }

  public async saveExtraConfigJson () {
    await fs.writeJson(EXTRA_CONFIG_PATH, this.extraJson)
  }

  public saveExtraConfigJsonSync () {
    fs.writeJsonSync(EXTRA_CONFIG_PATH, this.extraJson)
  }

  public async setSelectedProfile (key: string, type?: Auth.default | string) {
    if (typeof type === 'string') type = pluginMaster.logins[type]
    if (!type) type = pluginMaster.logins[pluginMaster.getAllProfiles().find(it => it.key === key).type]
    await type.validate(key, true).catch(console.error)
    const name = type[Auth.NAME]
    if (name === YGGDRASIL) {
      this.selectedUser.account = key
      this.selectedUser.profile = type.getData(key).uuid
      await this.saveLaunchProfileJson()
    } else this.extraJson.selectedUser = key
    this.extraJson.loginType = name
    await this.saveExtraConfigJson()
    pluginMaster.emit('selectedUser', key, type, name)
  }

  public async addProfile (version: string, name = '', icon = 'Furnace', avoidExists = false, save = true) {
    if (avoidExists) {
      const ver = Object.entries(this.profiles).find(([_, v]) => v.lastVersionId === version)
      if (ver) return ver[0]
    }
    const path = join(VERSIONS_PATH, version, version + '.json')
    if (!await fs.pathExists(path)) throw new Error('Json is not exists!')
    const key = genUUID()
    const created = new Date().toISOString()
    this.profiles[key] = {
      name,
      icon,
      created,
      lastUsed: created,
      lastVersionId: version,
      type: 'custom'
    }
    if (save) await this.saveLaunchProfileJson()
    localStorage.removeItem('skinCacheTime')
    this.cacheSkins().catch(console.error)
    return key
  }

  public async editProfile (key: string, name?: string, icon?: string) {
    const p = this.profiles[key]
    if (!p) throw new Error(`The profile (${key}) is not exists!`)
    if (name) p.name = name
    if (icon) p.icon = icon
    await this.saveLaunchProfileJson()
  }

  public async setMemory (mem: string) {
    const m = parseInt(mem, 10)
    this.extraJson.memory = Number.isNaN(m) || Object.is(m, Infinity) || m < 0 ? 0 : m
    await this.saveExtraConfigJson()
  }

  public async setDownloadProvider (key: string) {
    if (!(key in DownloadProviders)) return
    this.extraJson.downloadProvider = key
    await this.saveExtraConfigJson()
    localStorage.removeItem(MINECRAFT_MANIFEST_UPDATE_TIME)
  }

  public async setArgs (args: string) {
    this.extraJson.javaArgs = args
    await this.saveExtraConfigJson()
  }

  public async setDownloadThreads (num: number) {
    this.extraJson.downloadThreads = num
    downloader.syncSockets()
    await this.saveExtraConfigJson()
  }

  public async setSelectedVersion (id: string) {
    const profile = this.profiles[id]
    if (!profile) {
      notice({ content: $('No such version:') + ' ' + id, error: true })
      throw new Error('No such id: ' + id)
    }
    profile.lastUsed = new Date().toISOString()
    await this.saveLaunchProfileJson()

    this.resolveVersion(id)
      .then(rid => (pluginMaster.emit('switchVersion', profile, id, rid), fs.readJson(RESOURCES_VERSIONS_INDEX_PATH)
        .then((it: Record<string, ResourceVersion>) => it && it[rid] && openServerHome(it[rid].serverHome)))
      )
      .catch(() => {})

    this.setTasks()
  }

  public async toggleSound () {
    this.extraJson.soundOn = !this.extraJson.soundOn
    await this.saveExtraConfigJson()
  }

  public async toggleShowLog () {
    this.settings.showGameLog = !this.settings.showGameLog
    await this.saveLaunchProfileJson()
  }

  public setFold (val: boolean) {
    this.extraJson.fold = val
    this.saveExtraConfigJson()
  }

  public async toggleAnimation () {
    this.extraJson.animation = !this.extraJson.animation
    if (this.extraJson.animation) startAnimation()
    else stopAnimation()
    await this.saveExtraConfigJson()
  }

  public async toggleCopyMode () {
    this.extraJson.copyMode = !this.extraJson.copyMode
    await this.saveExtraConfigJson()
  }

  public async toggleSnapshots () {
    this.settings.enableSnapshots = !this.settings.enableSnapshots
    await this.saveLaunchProfileJson()
  }

  public async toggleNoChecker () {
    this.extraJson.noChecker = !this.extraJson.noChecker
    await this.saveExtraConfigJson()
  }

  public async checkModsDirectory () {
    const v = this.selectedVersion
    if (!v) return
    try {
      const s = await fs.lstat(MODS_PATH)
      if (!s.isDirectory() || s.isSymbolicLink()) return
    } catch (e) { return }
    const id = await this.resolveVersion(v.key)
    const dest = join(VERSIONS_PATH, id, 'mods')
    if (await fs.pathExists(dest)) {
      await fs.copy(MODS_PATH, dest, { overwrite: false })
      await fs.remove(MODS_PATH)
    } else await fs.rename(MODS_PATH, dest)
    await fs.symlink(dest, MODS_PATH, 'junction')
    openConfirmDialog({
      text: $('Mods folder detected, which has been moved to the game version {0}\'s root. Please try not to move the mods folder manually. PureLauncher will handle the mods.', id)
    })
    return v
  }

  public async checkModsDirectoryOfVersion (id: string, info?: ResourceVersion) {
    if (!info) info = (await fs.readJson(RESOURCES_VERSIONS_INDEX_PATH, { throws: false }) || { })[id]
    const versionRoot = join(VERSIONS_PATH, id)
    if (!info || !info.isolation) {
      await this.checkModsDirectory()
      if (await fs.pathExists(MODS_PATH)) {
        const s = await fs.lstat(MODS_PATH)
        if (s.isSymbolicLink()) await fs.unlink(MODS_PATH)
      }
      const dest = join(versionRoot, 'mods')
      if (!await fs.pathExists(MODS_PATH) && await fs.pathExists(dest)) await fs.symlink(dest, MODS_PATH, 'junction')
    }
  }

  public setTasks () {
    const noTitle = $('No Title')
    const lastRelease = $('last-release')
    const lastSnapshot = $('last-snapshot')
    const versions = Object
      .entries(this.profiles)
      .filter(v => this.settings.enableSnapshots || v[1].type !== 'latest-snapshot')
      .sort((a, b) => moment(b[1].lastUsed).valueOf() - moment(a[1].lastUsed).valueOf())
      .slice(0, 7)
    switch (process.platform) {
      case 'win32':
        remote.app.setJumpList([
          {
            type: 'tasks',
            name: $('Recent play'),
            items: versions.map(([version, v]) => ({
              icon: MC_LOGO_PATH,
              type: 'task',
              iconIndex: 0,
              program: process.execPath,
              args: ' ' + JSON.stringify(JSON.stringify({
                version,
                type: 'Launch',
                secret: localStorage.getItem('analyticsToken')
              })),
              title: `${v.type === 'latest-release' ? lastRelease
                : v.type === 'latest-snapshot' ? lastSnapshot : v.name || noTitle} (${v.lastVersionId})`
            }))
          }
        ])
        break
      case 'darwin':
        remote.app.dock.setMenu(remote.Menu.buildFromTemplate(versions.map(([_id, v]) => ({
          label: `${v.type === 'latest-release' ? lastRelease
            : v.type === 'latest-snapshot' ? lastSnapshot : v.name || noTitle} (${v.lastVersionId})`,
          click () { /* TODO: */ }
        }))))
        break
    }
  }

  public async setLocate (lang: string) {
    if (!(lang in langs)) throw new Error('No such lang: ' + lang)
    this.settings.locale = lang
    await this.saveLaunchProfileJson()
    applyLocate(lang)
  }

  public async ensureVersionManifest () {
    const timeStr = localStorage.getItem(MINECRAFT_MANIFEST_UPDATE_TIME)
    const time = timeStr ? parseInt(timeStr) : 0
    const t = time + 12 * 60 * 60 * 1000 > Date.now()
    if (t && this.versionManifest.timestamp) return
    let data: any
    if (t) {
      const d = localStorage.getItem(MINECRAFT_MANIFEST)
      if (d) {
        try {
          const data = JSON.parse(d)
          data[NOT_PROXY] = true
          this.versionManifest = data
        } catch (e) { console.error(e) }
      }
    }
    if (!data) await this.refreshVersionManifest().catch(console.error)
  }

  public async refreshVersionManifest () {
    const str = await fetch(urlJoin(
      this.downloadProvider.launchermeta || DownloadProviders.OFFICIAL.launchermeta,
      'mc/game/version_manifest.json'
    ), { cache: 'no-cache' }).then(it => it.text())
    const json = JSON.parse(str)
    json[NOT_PROXY] = true
    this.versionManifest = json
    localStorage.setItem(MINECRAFT_MANIFEST, str)
    localStorage.setItem(MINECRAFT_MANIFEST_UPDATE_TIME, Date.now().toString())
  }

  private loadLaunchProfileJson (json: this) {
    this.selectedUser = json.selectedUser || this.selectedUser
    this.authenticationDatabase = json.authenticationDatabase || this.authenticationDatabase
    this.clientToken = !json.clientToken || json.clientToken === '88888888-8888-8888-8888-888888888888'
      ? genUUID() : json.clientToken
    this.settings = json.settings || this.settings
    if (json.profiles) delete json.profiles['(Default)']
    this.profiles = json.profiles || this.profiles
    if (!Object.values(this.profiles).find(it => it.type === 'latest-release')) this.setDefaultVersions()
    applyLocate(this.settings.locale || DEFAULT_LOCATE, true)
    this.setTasks()
  }

  private loadExtraConfigJson (extra: this['extraJson']) {
    this.extraJson = { ...this.extraJson, ...extra }
    if (!extra.loginType && this.selectedUser.account && this.selectedUser.profile &&
      this.selectedUser.account in this.authenticationDatabase) {
      extra.loginType = YGGDRASIL
      extra.selectedUser = this.selectedUser.profile
    }
    if (extra.animation) startAnimation()
  }

  private onLoadLaunchProfileFailed (e: Error) {
    if (!e.message.includes('no such file or directory')) {
      console.error('Fail to load launcher profile', e)
    }
    fs.ensureDirSync(GAME_ROOT)
    if (fs.pathExistsSync(LAUNCH_PROFILE_PATH)) {
      fs.renameSync(LAUNCH_PROFILE_PATH, join(GAME_ROOT, `${LAUNCH_PROFILE_FILE_NAME}.${Date.now()}.bak`))
    }
    this.setDefaultVersions()
    this.saveLaunchProfileJsonSync()
  }

  private setDefaultVersions () {
    this.profiles.b7472ad16d074bb8336095262999a176 = {
      name: '',
      created: '1970-01-01T00:00:00.000Z',
      icon: 'Grass',
      lastUsed: '1970-01-01T00:00:00.000Z',
      lastVersionId: 'latest-release',
      type: 'latest-release'
    }
    this.profiles['439b6eb6c263108aebb8f85dfe31bc17'] = {
      name: '',
      created: '1970-01-01T00:00:00.000Z',
      icon: 'Crafting_Table',
      lastUsed: '1970-01-01T00:00:00.000Z',
      lastVersionId: 'latest-snapshot',
      type: 'latest-snapshot'
    }
  }

  private async onLoadExtraConfigFailed (e: Error) {
    if (!e.message.includes('no such file or directory')) {
      console.error('Fail to load extra launcher profile', e)
    }
    if (await fs.pathExists(EXTRA_CONFIG_PATH)) {
      await fs.rename(EXTRA_CONFIG_PATH, join(APP_PATH, `${EXTRA_CONFIG_FILE_NAME}.${Date.now()}.bak`))
    }
    await this.saveExtraConfigJson()
  }

  private async syncVersions () {
    const versions: any = { }
    let modified = false
    const json = await fs.readJson(RESOURCES_VERSIONS_INDEX_PATH, { throws: false }) || {}
    Object.values(this.profiles).forEach(it => it.type !== 'latest-release' && it.type !== 'latest-snapshot' &&
      (versions[it.lastVersionId] = null))
    await Promise.all(Object.values(json)
      .filter((it: any) => typeof versions[it.resolvedId] === 'undefined')
      .map((it: any) => this.addProfile(it.resolvedId, it.title, null, false, false).catch(e => {
        console.error(e)
        if (e && e.message === 'Json is not exists!' && delete json[it.id]) modified = true
      })))
    if (modified) await fs.writeJson(RESOURCES_VERSIONS_INDEX_PATH, versions)
    await this.saveLaunchProfileJson()
  }
}
