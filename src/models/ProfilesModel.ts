import { Model } from 'use-model'
import { join, dirname } from 'path'
import { getJavaVersion, getMinecraftRoot, appDir, cacheSkin, genUUID } from '../util'
import { remote } from 'electron'
import { platform } from 'os'
import { YGGDRASIL } from '../plugin/logins'
import { langs, applyLocate } from '../i18n'
import fs from 'fs-extra'
import merge from 'lodash.merge'
import pAll from 'p-all'
import moment from 'moment'
import * as Auth from '../plugin/Authenticator'

const LAUNCH_PROFILE = 'launcher_profiles.json'
const EXTRA_CONFIG = 'config.json'
const icon = join(process.cwd(), 'unpacked/mc-logo.ico')

interface Version {
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
  profiles: { [key: string]: { displayName: string } }
  properties: Array<{ [key: string]: string }>,
}
export default class ProfilesModel extends Model {
  public i = 0
  public settings = {
    enableSnapshots: false,
    locale: 'zh-cn',
    showMenu: true,
    showGameLog: false,
    soundOn: true
  }
  public selectedUser = {
    account: '',
    profile: ''
  }
  public profiles: { [key: string]: Version } = {}
  public authenticationDatabase: { [key: string]: User } = {}
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

  public loginDialogVisible = false

  public readonly launchProfilePath: string
  public readonly extraConfigPath: string

  public get selectedVersion () {
    let version: Version
    let time = -Infinity
    for (const id in this.profiles) {
      const v = this.profiles[id]
      const t = moment(v.lastUsed).valueOf()
      if (t > time && (this.settings.enableSnapshots || v.type !== 'latest-snapshot')) {
        version = v
        time = t
      }
    }
    return version
  }

  constructor (readonly root = getMinecraftRoot()) {
    super()
    this.launchProfilePath = join(this.root, LAUNCH_PROFILE)
    this.extraConfigPath = join(appDir, EXTRA_CONFIG)
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
    this.cacheSkins().catch(console.error)
  }

  public modify (fn: (t: this) => void) {
    fn(this)
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
      this.saveExtraConfigJsonSync()
      notice({ content: $('Current account is invalid, please re-login!') })
    }
  }

  public addI () { this.i++ }

  public async cacheSkins () {
    const t = localStorage.getItem('skinCacheTime')
    if (t && parseInt(t, 10) + 24 * 60 * 60 * 1000 > Date.now()) return
    if (!await fetch('https://minotar.net/').then(it => it.ok).catch(() => false)) return
    await pAll(pluginMaster.getAllProfiles().filter(it => it.skinUrl)
      .map(it => () => cacheSkin(it)), { concurrency: 5 })
    localStorage.setItem('skinCacheTime', Date.now().toString())
    this.addI()
  }

  public * setJavaPath () {
    yield remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      title: $('Locate Java'),
      message: $('Locate the path of Java 8'),
      filters: [
        { name: $('Executable File (Javaw)'), extensions: platform() === 'win32' ? ['exe'] : [] }
      ]
    }, ([file]) => {
      const version = getJavaVersion(file)
      if (version) {
        this.extraJson.javaPath = file
        this.saveExtraConfigJsonSync()
      } else notice({ content: $('Incorrect java version!'), error: true })
    })
  }

  public * loadAllConfigs () {
    yield fs.readJson(this.launchProfilePath).then(j => this.loadLaunchProfileJson(j),
      e => this.onLoadLaunchProfileFailed(e))
    yield fs.readJson(this.extraConfigPath).then(j => this.loadExtraConfigJson(j),
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

  public * saveLaunchProfileJson () {
    // not throw but return a null
    const json = yield fs.readJson(this.launchProfilePath, { throws: false }) || {}

    yield fs.writeJson(this.launchProfilePath, merge(json, {
      settings: this.selectedUser,
      selectedUser: this.selectedUser,
      profiles: this.profiles,
      authenticationDatabase: this.authenticationDatabase,
      clientToken: this.clientToken
    }))
  }

  public * saveExtraConfigJson () {
    yield fs.writeJson(this.extraConfigPath, this.extraJson)
  }

  public saveExtraConfigJsonSync () {
    fs.writeJsonSync(this.extraConfigPath, this.extraJson)
  }

  public * setSelectedProfile (key: string, type?: Auth.default | string) {
    if (typeof type === 'string') type = pluginMaster.logins[type]
    if (!type) type = pluginMaster.logins[pluginMaster.getAllProfiles().find(it => it.key === key).type]
    yield type.validate(key)
    const name = type[Auth.NAME]
    if (name === YGGDRASIL) {
      this.selectedUser.account = key
      this.selectedUser.profile = type.getData(key).uuid
      this.saveLaunchProfileJsonSync()
    } else this.extraJson.selectedUser = key
    this.extraJson.loginType = name
    this.saveExtraConfigJsonSync()
  }

  public * setMemory (mem: string) {
    const m = parseInt(mem, 10)
    this.extraJson.memory = Number.isNaN(m) || Object.is(m, Infinity) || m < 0 ? 0 : m
    yield* this.saveExtraConfigJson()
  }

  public * toggleBmclAPI () {
    this.extraJson.bmclAPI = !this.extraJson.bmclAPI
    yield* this.saveExtraConfigJson()
  }

  public * setArgs (args: string) {
    this.extraJson.javaArgs = args
    yield* this.saveExtraConfigJson()
  }

  public * setSelectedVersion (id: string) {
    const profile = this.profiles[id]
    if (!profile) {
      notice({ content: $('No such version:') + ' ' + id, error: true })
      throw new Error('No such id: ' + id)
    }
    profile.lastUsed = new Date().toISOString()
    yield* this.saveLaunchProfileJson()
    this.setTasks()
  }

  public * toggleSound () {
    this.settings.soundOn = !this.settings.soundOn
    yield* this.saveLaunchProfileJson()
  }

  public * toggleShowLog () {
    this.settings.showGameLog = !this.settings.showGameLog
    yield* this.saveLaunchProfileJson()
  }

  public * toggleAnimation () {
    this.extraJson.animation = this.extraJson.animation
    yield* this.saveExtraConfigJson()
  }

  public * toggleSandbox () {
    this.extraJson.sandbox = this.extraJson.sandbox
    yield* this.saveExtraConfigJson()
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
        remote.app.dock.setMenu(remote.Menu.buildFromTemplate(versions.map(([id, v]) => ({
          label: `${v.type === 'latest-release' ? lastRelease
            : v.type === 'latest-snapshot' ? lastSnapshot : v.name || noTitle} (${v.lastVersionId})`,
          click () { /* TODO: */ }
        }))))
        break
    }
  }

  public * setLocate (lang: string) {
    if (!(lang in langs)) throw new Error('No such lang: ' + lang)
    this.settings.locale = lang
    yield* this.saveLaunchProfileJson()
    applyLocate(lang)
  }

  private loadLaunchProfileJson (json: any) {
    this.selectedUser = merge(this.selectedUser, json)
    this.authenticationDatabase = merge(this.authenticationDatabase, json.authenticationDatabase)
    this.clientToken = json.clientToken
    this.settings = merge(this.settings, json.settings)
    this.profiles = merge(this.profiles, json.profiles)
    if (!Object.values(this.profiles).find(it => it.type === 'latest-release')) this.setDefaultVersions()
    applyLocate(this.settings.locale, true)
    this.setTasks()
  }

  private loadExtraConfigJson (extra: this['extraJson']) {
    this.extraJson = extra
  }

  private onLoadLaunchProfileFailed (e: Error) {
    if (e.message.includes('no such file or directory')) {
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
