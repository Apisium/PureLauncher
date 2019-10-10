import { Model } from 'use-model'
import { join, dirname } from 'path'
import { getJavaVersion, getMinecraftRoot, appDir, cacheSkin } from '../util'
import { remote } from 'electron'
import { platform } from 'os'
import { langs, applyLocate } from '../i18n'
import fs from 'fs-extra'
import merge from 'lodash.merge'
import pAll from 'p-all'

const LAUNCH_PROFILE = 'launcher_profiles.json'
const EXTRA_CONFIG = 'config.json'

export const ONLINE_LOGIN = 'Online'
export const OFFLINE_LOGIN = 'Offline'

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
  public clientToken = ''
  public extraJson = {
    javaPath: '',
    bmclAPI: true,
    memory: 0,
    animation: true,
    sandbox: true,
    selectedUser: '',
    loginType: '',
    offlineAuthenticationDatabase: [] as string[],
    javaArgs: '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 ' +
      '-XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M'
  }

  public readonly launchProfilePath: string
  public readonly extraConfigPath: string

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
    this.cacheSkins().catch(console.error).then(() => {
      const u = this.getCurrentProfile()
      if (u.username) cacheSkin(u.uuid || u.username)
    }).catch(console.error)
  }

  public getCurrentProfile (): { type: string, accessToken?: string,
    uuid?: string, username: string } {
    switch (this.extraJson.loginType) {
      case '': break
      case ONLINE_LOGIN:
        const su = this.selectedUser
        if (su.account && su.profile) {
          if (su.account in this.authenticationDatabase) {
            const u = this.authenticationDatabase[su.account]
            if (su.profile in u.profiles) {
              const p = u[su.profile].profiles
              return { username: p.displayName, uuid: su.profile, type: ONLINE_LOGIN, accessToken: u.accessToken }
            }
          }
          su.profile = su.account = ''
          this.saveLaunchProfileJsonSync()
        }
        break
      case OFFLINE_LOGIN:
        const cu = this.extraJson.selectedUser
        if (cu) {
          if (this.extraJson.offlineAuthenticationDatabase.includes(cu)) return { username: cu, type: OFFLINE_LOGIN }
          this.extraJson.selectedUser = ''
          this.extraJson.loginType = ''
          this.saveExtraConfigJsonSync()
        }
        break
    }
    return { username: '', type: '' }
  }

  public async cacheSkins () {
    const t = localStorage.getItem('skinCacheTime')
    if (t && parseInt(t, 10) + 24 * 60 * 60 * 1000 > Date.now()) return
    if (!await fetch('https://minotar.net/').then(it => it.ok).catch(() => false)) return
    await pAll(Object
      .values(this.authenticationDatabase)
      .flatMap(a => Object.keys(a.profiles))
      .concat(this.extraJson.offlineAuthenticationDatabase).map(it => () => cacheSkin(it)), { concurrency: 5 })
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
    }, (files) => {
      const version = getJavaVersion(files[0])
      if (version) {
        this.extraJson.javaPath = files[0]
        return this.saveExtraConfigJson()
      } else {
        // show some ui here to let user know
      }
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
      profile: this.profiles,
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
      profile: this.profiles,
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
    if (!profile) throw new Error('No such id: ' + id) // TODO: Add a dialog
    profile.lastUsed = new Date().toISOString()
    yield* this.saveExtraConfigJson()
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

  public * setLocate (lang: string) {
    if (!(lang in langs)) throw new Error('No such lang: ' + lang)
    this.settings.locale = lang
    yield* this.saveLaunchProfileJson()
    applyLocate(lang)
  }

  private loadLaunchProfileJson (json: any) {
    this.selectedUser = merge(this.selectedUser, json)
    this.authenticationDatabase = merge(this.authenticationDatabase, json.authenticationDatabase)
    this.clientToken = merge(this.clientToken, json.clientToken)
    this.settings = merge(this.settings, json.settings)
    this.profiles = merge(this.profiles, json.profiles)
    applyLocate(this.settings.locale, true)
    this.getCurrentProfile()
  }

  private loadExtraConfigJson (extra: this['extraJson']) {
    this.extraJson = extra
  }

  private addI () { this.i++ }

  private onLoadLaunchProfileFailed (e: Error) {
    if (e.message.includes('no such file or directory')) {
      console.error('Fail to load launcher profile', e)
    }
    if (fs.pathExistsSync(this.launchProfilePath)) {
      fs.renameSync(this.launchProfilePath, `${this.launchProfilePath}.${Date.now()}.bak`)
    }
    fs.mkdirsSync(dirname(this.launchProfilePath))
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
    this.saveLaunchProfileJsonSync()
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
