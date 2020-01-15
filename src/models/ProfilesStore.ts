import { Store, NOT_PROXY } from 'reqwq'
import { join, dirname } from 'path'
import { getJavaVersion, getMinecraftRoot, appDir, cacheSkin, genUUID } from '../utils/index'
import { remote } from 'electron'
import { platform } from 'os'
import { Installer } from '@xmcl/installer'
import { YGGDRASIL } from '../plugin/logins'
import { langs, applyLocate } from '../i18n'
import fs from 'fs-extra'
import merge from 'lodash/merge'
import pAll from 'p-all'
import moment from 'moment'
import * as Auth from '../plugin/Authenticator'

const LAUNCH_PROFILE = 'launcher_profiles.json'
const VERSION_MANIFEST = 'version_manifest.json'
const EXTRA_CONFIG = 'config.json'
const icon = join(process.cwd(), 'unpacked/mc-logo.ico')

const defaultLocale = (navigator.languages[0] || 'zh-cn').toLowerCase()

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
    locale: defaultLocale,
    showMenu: true,
    showGameLog: false,
    soundOn: true
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
    bmclAPI: true,
    memory: 0,
    animation: true,
    sandbox: true,
    selectedUser: '',
    loginType: '',
    javaArgs: '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 ' +
      '-XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M'
  }
  public versionManifest: Installer.VersionMetaList & { [NOT_PROXY]: true } = {
    [NOT_PROXY]: true,
    timestamp: '',
    versions: [],
    latest: {
      release: '',
      snapshot: ''
    }
  }

  public loginDialogVisible = false

  public readonly launchProfilePath: string
  public readonly extraConfigPath: string
  public readonly modsPath: string

  public get selectedVersion () {
    let version: Version
    let time = -Infinity
    let key = ''
    for (key in this.profiles) {
      const v = this.profiles[key]
      const t = moment(v.lastUsed).valueOf()
      if (t > time && (this.settings.enableSnapshots || v.type !== 'latest-snapshot')) {
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

  constructor (readonly root = getMinecraftRoot()) {
    super()
    this.launchProfilePath = join(this.root, LAUNCH_PROFILE)
    this.extraConfigPath = join(appDir, EXTRA_CONFIG)
    this.modsPath = join(this.root, 'mods')
    try {
      this.loadLaunchProfileJson(fs.readJsonSync(this.launchProfilePath))
    } catch (e) {
      this.onLoadLaunchProfileFailed(e)
    }

    try {
      this.loadExtraConfigJson(fs.readJsonSync(this.extraConfigPath))
    } catch (e) {
      this.onLoadExtraConfigFailed(e)
    }

    this.loadVersionManifest().catch(console.error)
    this.cacheSkins().catch(console.error)
    this.checkModsDirectory().catch(console.error)
  }

  public setLoginDialogVisible (state = true) { this.loginDialogVisible = state }

  public getCurrentProfile () {
    if (!this.extraJson.loginType) return null
    try {
      if (this.extraJson.loginType === YGGDRASIL) {
        return this.selectedUser.account ? null : pluginMaster.logins[YGGDRASIL].getData(this.selectedUser.account)
      } else return pluginMaster.getCurrentLogin().getData(this.extraJson.selectedUser)
    } catch (e) {
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
        { name: $('Executable File (Javaw)'), extensions: platform() === 'win32' ? ['exe'] : [] }
      ]
    })
    if (ret.canceled) return
    const file = ret.filePaths[0]
    const version = getJavaVersion(file)
    if (version) {
      this.extraJson.javaPath = file
      this.saveExtraConfigJsonSync()
    } else notice({ content: $('Incorrect java version!'), error: true })
  }

  public async loadAllConfigs () {
    await fs.readJson(this.launchProfilePath).then(j => this.loadLaunchProfileJson(j),
      e => this.onLoadLaunchProfileFailed(e))
    await fs.readJson(this.extraConfigPath).then(j => this.loadExtraConfigJson(j),
      e => this.onLoadExtraConfigFailed(e))
  }

  public saveLaunchProfileJsonSync () {
    // not throw but return a null
    const json = fs.readJsonSync(this.launchProfilePath, { throws: false }) || {}

    fs.writeJsonSync(this.launchProfilePath, merge(json, {
      settings: this.selectedUser,
      selectedUser: this.selectedUser,
      profiles: this.profiles,
      authenticationDatabase: this.authenticationDatabase,
      clientToken: this.clientToken
    }))
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
    const json = await fs.readJson(this.launchProfilePath, { throws: false }) || {}

    const data: Pick<this, 'settings' | 'selectedUser' | 'profiles' | 'authenticationDatabase' | 'clientToken'> = {
      settings: this.settings,
      selectedUser: this.selectedUser,
      profiles: this.profiles,
      authenticationDatabase: this.authenticationDatabase,
      clientToken: this.clientToken
    }
    await fs.writeJson(this.launchProfilePath, merge(json, data))
  }

  public async saveExtraConfigJson () {
    await fs.writeJson(this.extraConfigPath, this.extraJson)
  }

  public saveExtraConfigJsonSync () {
    fs.writeJsonSync(this.extraConfigPath, this.extraJson)
  }

  public async setSelectedProfile (key: string, type?: Auth.default | string) {
    if (typeof type === 'string') type = pluginMaster.logins[type]
    if (!type) type = pluginMaster.logins[pluginMaster.getAllProfiles().find(it => it.key === key).type]
    await type.validate(key)
    const name = type[Auth.NAME]
    if (name === YGGDRASIL) {
      this.selectedUser.account = key
      this.selectedUser.profile = type.getData(key).uuid
      this.saveLaunchProfileJsonSync()
    } else this.extraJson.selectedUser = key
    this.extraJson.loginType = name
    this.saveExtraConfigJsonSync()
  }

  public async setMemory (mem: string) {
    const m = parseInt(mem, 10)
    this.extraJson.memory = Number.isNaN(m) || Object.is(m, Infinity) || m < 0 ? 0 : m
    await this.saveExtraConfigJson()
  }

  public async toggleBmclAPI () {
    this.extraJson.bmclAPI = !this.extraJson.bmclAPI
    await this.saveExtraConfigJson()
  }

  public async setArgs (args: string) {
    this.extraJson.javaArgs = args
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
    this.setTasks()
  }

  public async toggleSound () {
    this.settings.soundOn = !this.settings.soundOn
    await this.saveLaunchProfileJson()
  }

  public async toggleShowLog () {
    this.settings.showGameLog = !this.settings.showGameLog
    await this.saveLaunchProfileJson()
  }

  public async toggleAnimation () {
    console.log(this.extraJson)
    this.extraJson.animation = !this.extraJson.animation
    await this.saveExtraConfigJson()
  }

  public async toggleSandbox () {
    this.extraJson.sandbox = !this.extraJson.sandbox
    await this.saveExtraConfigJson()
  }

  public async checkModsDirectory () {
    const v = this.selectedVersion
    if (!v) return
    const dir = this.modsPath
    try {
      const s = await fs.stat(dir)
      if (!s.isDirectory() || s.isSymbolicLink()) return
    } catch (e) { return }
    const dest = join(this.root, 'versions', v.lastVersionId, 'mods')
    if (await fs.pathExists(dest)) {
      await fs.copy(dir, dest, { overwrite: false })
      await fs.remove(dir)
    } else await fs.rename(dir, dest)
    await fs.symlink(dir, dest, 'dir')
    openConfirmDialog({
      text: $('Mods folder detected, which has been moved to the game version {0}\'s root. Please try not to move the mods folder manually. PureLauncher will handle the mods.', v.lastVersionId)
    })
    return v
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
            items: versions.map(([id, v]) => ({
              icon,
              type: 'task',
              iconIndex: 0,
              program: process.execPath,
              args: `{"type":"launch","version":${JSON.stringify(id)}}`,
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
    if (this.versionManifest.timestamp === '0') {
      const data: any = await Installer.updateVersionMeta()
      data[NOT_PROXY] = true
      this.versionManifest = data
      this.saveVersionManifest()
    }
  }

  public async refreshVersionManifest () {
    const data: any = await Installer.updateVersionMeta({ fallback: this.versionManifest })
    data[NOT_PROXY] = true
    this.versionManifest = data
    this.saveVersionManifest()
  }

  private async saveVersionManifest () {
    await fs.writeFile(join(this.root, VERSION_MANIFEST), JSON.stringify(this.versionManifest))
  }

  private async loadVersionManifest () {
    try {
      this.versionManifest = await fs.readFile(join(this.root, VERSION_MANIFEST)).then(b => JSON.parse(b.toString()))
    } catch {
      this.refreshVersionManifest()
    }
  }

  private loadLaunchProfileJson (json: any) {
    this.selectedUser = merge(this.selectedUser, json.selectedUser)
    this.authenticationDatabase = merge(this.authenticationDatabase, json.authenticationDatabase)
    this.clientToken = json.clientToken
    this.settings = merge(this.settings, json.settings)
    this.profiles = merge(this.profiles, json.profiles)
    if (!Object.values(this.profiles).find(it => it.type === 'latest-release')) this.setDefaultVersions()
    applyLocate(this.settings.locale || defaultLocale, true)
    this.setTasks()
  }

  private loadExtraConfigJson (extra: this['extraJson']) {
    this.extraJson = extra
  }

  private onLoadLaunchProfileFailed (e: Error) {
    if (!e.message.includes('no such file or directory')) {
      console.error('Fail to load launcher profile', e)
    }
    if (fs.pathExistsSync(this.launchProfilePath)) {
      fs.renameSync(this.launchProfilePath, `${this.launchProfilePath}.${Date.now()}.bak`)
    }
    fs.mkdirsSync(dirname(this.launchProfilePath))
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
    if (await fs.pathExists(this.extraConfigPath)) {
      await fs.rename(this.extraConfigPath, `${this.extraConfigPath}.${Date.now()}.bak`)
    }
    await fs.mkdirs(dirname(this.extraConfigPath))
    await this.saveExtraConfigJson()
  }
}
