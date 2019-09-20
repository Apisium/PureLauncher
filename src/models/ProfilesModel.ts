import { Model } from 'use-model'
import fs from 'fs-extra'
import { join } from 'path'
import { getJavaVersion, getMinecraftRoot } from '../util'
import { remote } from 'electron'
import { platform } from 'os'
import merge from 'lodash.merge'

const LAUNCH_PROFILE = 'launcher_profiles.json'
const EXTRA_CONFIG = 'any_profile.json'

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
    selectedUser: '',
    offlineAuthenticationDatabase: [] as string[],
    javaArgs: '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 ' +
      '-XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M'
  }

  public readonly launchProfilePath: string
  public readonly extraConfigPath: string

  constructor (readonly root = getMinecraftRoot()) {
    super()
    this.launchProfilePath = join(this.root, LAUNCH_PROFILE)
    this.extraConfigPath = join(this.root, EXTRA_CONFIG)
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
  }

  public * setJavaPath () {
    yield remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      title: '选择 Java',
      message: '请选择启动 Minecraft 的 Java 8',
      filters: [
        { name: '可执行文件', extensions: platform() === 'win32' ? ['exe'] : [] }
      ]
    }, (files) => {
      const version = getJavaVersion(files[0])
      if (version) {
        this.extraJson.javaPath = files[0]
        this.saveExtraConfigJson()
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

  public * toggleSound () {
    this.settings.soundOn = !this.settings.soundOn
    yield* this.saveLaunchProfileJson()
  }

  public * toggleShowLog () {
    this.settings.showGameLog = !this.settings.showGameLog
    yield* this.saveLaunchProfileJson()
  }

  private loadLaunchProfileJson (json: any) {
    console.log(json)
    this.selectedUser = merge(this.selectedUser, json)
    this.authenticationDatabase = merge(this.authenticationDatabase, json.authenticationDatabase)
    this.clientToken = merge(this.clientToken, json.clientToken)
    this.settings = merge(this.settings, json.settings)
    this.profiles = merge(this.profiles, json.profiles)
    console.log(this)
  }

  private loadExtraConfigJson (extra: this['extraJson']) {
    this.extraJson = extra
  }

  private onLoadLaunchProfileFailed (e: any) {
    console.error(`Fail to load launcher profile`)
    console.error(e)
  }

  private onLoadExtraConfigFailed (e: any) {
    console.error(`Fail to load extra launcher profile`)
    console.error(e)
  }
}
