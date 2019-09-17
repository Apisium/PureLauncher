import { Model } from 'use-model'
import fs from 'fs-extra'

/// minecraft root utils start ///

import { remote } from 'electron'
import { join } from 'path'
import { platform } from 'os'

function getMinecraftRoot () {
  return join(remote.app.getPath('appData'), platform() === 'darwin' ? 'minecraft' : '.minecraft')
}

/// minecraft root utils end ///

/// java utils start ///

import { exec } from 'child_process'

function getJavaVersion (path: string) {
  const parseVersion = (str: string) => {
    const match = /(\d+\.\d+\.\d+)(_(\d+))?/.exec(str)
    if (match === null) return undefined
    return match[1]
  }
  return new Promise<string>((resolve, reject) => {
    exec(`${path} -version`, (_, stdout, serr) => {
      if (!serr) {
        resolve(undefined)
      } else {
        const version = parseVersion(serr)
        if (version !== undefined) {
          resolve(version)
        } else {
          resolve(undefined)
        }
      }
    })
  })
}

/// java utils end ///

const LAUNCH_PROFILE = 'launch_profile.json'
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

  public * setJavaPath (path: string) {
    // TODO: Check java exists
    const version = yield getJavaVersion(path)
    if (version) {
      this.extraJson.javaPath = path
      yield* this.saveExtraConfigJson()
    }
  }

  public * loadAllConfigs () {
    yield fs.readJson(this.launchProfilePath).then(j => this.loadLaunchProfileJson(j),
      e => this.onLoadLaunchProfileFailed(e))
    yield fs.readJson(this.extraConfigPath).then(j => this.loadExtraConfigJson(j),
      e => this.onLoadExtraConfigFailed(e))
  }

  public * saveLaunchProfileJson () {
    yield fs.writeJson(this.launchProfilePath, {
      settings: this.selectedUser,
      selectedUser: this.selectedUser,
      profile: this.profiles,
      authenticationDatabase: this.authenticationDatabase,
      clientToken: this.clientToken
    })
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
    this.selectedUser = json.selectedUser
    this.authenticationDatabase = json.authenticationDatabase
    this.clientToken = json.clientToken
    this.settings = json.settings
    this.profiles = json.profiles
  }

  private loadExtraConfigJson (extra: this['extraJson']) {
    this.extraJson = extra
  }

  private onLoadLaunchProfileFailed (e: any) {

  }

  private onLoadExtraConfigFailed (e: any) {

  }
}
