import { Model } from 'use-model'
// import fse from 'fs-extra'

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
  public profiles: { [key: string]: Version } = { }
  public authenticationDatabase: { [key: string]: User } = { }
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

  constructor () {
    super()
    // TODO: loadConfigSync
  }

  public * setJavaPath (path: string) {
    // TODO: Check java exists
    yield* this.saveConfig()
  }

  public * loadConfig () {
    // TODO:fs-extra.readJson()
  }

  public * saveConfig () {
    // TODO:Async!!!!
  }

  public * setMemory (mem: string) {
    const m = parseInt(mem, 10)
    this.extraJson.memory = Number.isNaN(m) || Object.is(m, Infinity) || m < 0 ? 0 : m
    yield* this.saveConfig()
  }

  public * toggleBmclAPI () {
    this.extraJson.bmclAPI = !this.extraJson.bmclAPI
    yield* this.saveConfig()
  }

  public * setArgs (args: string) {
    this.extraJson.javaArgs = args
    yield* this.saveConfig()
  }

  public * toggleSound () {
    this.settings.soundOn = !this.settings.soundOn
    yield* this.saveConfig()
  }

  public * toggleShowLog () {
    this.settings.showGameLog = !this.settings.showGameLog
    yield* this.saveConfig()
  }
}
