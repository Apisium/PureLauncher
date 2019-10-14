import fs from 'fs-extra'
import Authenticator, { RegisterAuthenticator, Profile } from './Authenticator'
import { genUUID, fetchJson, appDir } from '../util'
import { join } from 'path'

const BASE_URL = 'https://authserver.mojang.com/'
const saveFile = () => (__profilesModel().saveLaunchProfileJson() as any as Promise<void>).catch(e => {
  console.error(e)
  throw new Error('保存失败!')
})

export const YGGDRASIL = 'yggdrasil'
@RegisterAuthenticator(YGGDRASIL, () => $('Online Login'), require('../assets/images/steve.png'), [
  {
    name: 'email',
    title: () => $('Email'),
    inputProps: { type: 'email', required: true }
  },
  {
    name: 'password',
    title: () => $('Password'),
    inputProps: { type: 'password', required: true }
  }
], { name: () => $('Register'), url: () => 'https://my.minecraft.net/store/minecraft/#register' })
class Yggdrasil extends Authenticator {
  public async login (options: { email: string, password: string }) {
    const m = __profilesModel()
    const p = Object.values(m.authenticationDatabase)
    if (p.find(it => it.username.toLowerCase() === options.password.toLowerCase())) throw new Error('帐号已存在!')
    const data = await fetchJson(BASE_URL + 'authenticate', true, {
      agent: 'Minecraft',
      username: options.email,
      password: options.password,
      clientToken: m.clientToken,
      requestUser: true
    }).catch(e => {
      console.error(e)
      throw new Error('请求失败!')
    })
    if (!data || data.error) {
      console.error(data)
      throw new Error('发生错误!')
    }
    if (!data.selectedProfile || !data.selectedProfile.id) throw new Error('你还有没有购买正版!')
    const sp = data.selectedProfile
    if (p.flatMap(it => Object.keys(it.profiles)).includes(sp.id)) throw new Error('你已经登录了!')
    m.modify(n => {
      n.authenticationDatabase[data.user.id] = {
        properties: [],
        username: data.user.username,
        accessToken: data.accessToken,
        profiles: { [sp.id]: { displayName: sp.name } }
      }
      n.selectedUser.account = data.user.includes
      n.selectedUser.profile = sp.id
    })
    await saveFile()
    return data.user.id as string
  }
  public async logout (key: string) {
    const m = __profilesModel()
    const p = m.authenticationDatabase[key]
    if (!p) throw new Error('账户不存在!')
    const d = await fetchJson(BASE_URL + 'invalidate', true, { accessToken: p.accessToken, clientToken: m.clientToken })
      .catch(e => {
        console.error(e)
        throw new Error('请求失败!')
      })
    if (!d && d.error) {
      console.error(d)
      throw new Error('发生错误!')
    }
    m.modify(n => void (delete n.authenticationDatabase[key]))
    await saveFile()
  }
  public async refresh (key: string) {
    const m = __profilesModel()
    const p = m.authenticationDatabase[key]
    if (!p) throw new Error('账户不存在!')
    const d = await fetchJson(BASE_URL + 'refresh', true, {
      clientToken: m.clientToken, accessToken: p.accessToken, requestUser: true })
      .catch(e => {
        console.error(e)
        throw new Error('请求失败!')
      })
    if (!d || d.error) {
      console.error(d)
      throw new Error('发生错误!')
    }
    m.modify(n => {
      const p2 = n.authenticationDatabase[key]
      p2.accessToken = d.accessToken
      p2.username = d.user.username
      p2.profiles[d.selectedProfile.id].displayName = d.selectedProfile.name
    })
    await saveFile()
  }
  public async validate (key: string) {
    const m = __profilesModel()
    const p = m.authenticationDatabase[key]
    if (!p) throw new Error('账户不存在!')
    const d = await fetchJson(BASE_URL + 'validate', true, { clientToken: m.clientToken, accessToken: p.accessToken })
      .catch(e => {
        console.error(e)
        throw new Error('请求失败!')
      })
    if (d && d.error) {
      console.error(d)
      m.modify(n => void (delete n.authenticationDatabase[key]))
      await saveFile()
      return false
    }
    return true
  }
  public getData (key: string) {
    const m = __profilesModel()
    const p = m.authenticationDatabase[key]
    if (!p) throw new Error('账户不存在!')
    const uuid = Object.keys(p.profiles)[0]
    if (!uuid) throw new Error('账户不存在!')
    return {
      key,
      uuid,
      type: YGGDRASIL,
      displayName: p.username,
      clientToken: m.clientToken,
      accessToken: p.accessToken,
      username: p.profiles[uuid].displayName,
      skinUrl: 'https://minotar.net/skin/' + uuid
    }
  }
  public getAllProfiles () {
    const m = __profilesModel()
    const clientToken = m.clientToken
    return Object
      .entries(m.authenticationDatabase)
      .map(([key, it]) => {
        const uuid = Object.keys(it.profiles)[0]
        return uuid ? {
          key,
          uuid,
          clientToken,
          type: YGGDRASIL,
          displayName: it.username,
          accessToken: it.accessToken,
          username: it.profiles[uuid].displayName,
          skinUrl: 'https://minotar.net/skin/' + uuid
        } : null
      }).filter(Boolean)
  }
}

const OFFLINE = 'Offline'
@RegisterAuthenticator(OFFLINE, () => $('Offline Login'), require('../assets/images/zombie.png'), [
  {
    name: 'username',
    title: () => $('Username'),
    inputProps: { required: true, pattern: '\\w{2,16}' }
  }
])
class Offline extends Authenticator {
  private db: { [key: string]: string } = fs.readJsonSync(join(appDir, 'offline.json'), { throws: false }) || { }
  public async login (options: { username: string }) {
    const id = genUUID('OfflinePlayer:' + options.username.toLowerCase())
    if (id in this.db) throw new Error('账户已存在!')
    this.db[id] = options.username
    await this.save()
    return id
  }
  public async logout (id: string) {
    if (!(id in this.db)) throw new Error('账户不存在!')
    delete this.db[id]
    await this.save()
  }
  public refresh (id: string) {
    if (!(id in this.db)) throw new Error('账户不存在!')
    return Promise.resolve()
  }
  public validate (id: string): Promise<boolean> {
    if (!(id in this.db)) throw new Error('账户不存在!')
    return Promise.resolve(true)
  }
  public getData (uuid: string): Profile {
    const username = this.db[uuid]
    if (!username) throw new Error('账户不存在!')
    return {
      uuid,
      username,
      key: uuid,
      type: OFFLINE,
      clientToken: genUUID(),
      accessToken: genUUID(),
      skinUrl: 'https://minotar.net/skin/' + username
    }
  }
  public getAllProfiles (): Profile[] {
    return Object.entries(this.db).map(([uuid, username]) => ({
      uuid,
      username,
      key: uuid,
      type: OFFLINE,
      clientToken: genUUID(),
      accessToken: genUUID(),
      skinUrl: 'https://minotar.net/skin/' + username
    }))
  }
  private save () {
    return fs.writeJson(join(appDir, 'offline.json'), this.db).catch(e => {
      console.error(e)
      throw new Error('保存失败!')
    })
  }
}

export default class Master {
  public logins: { [type: string]: Authenticator } = { [YGGDRASIL]: new Yggdrasil(), [OFFLINE]: new Offline() }
  public getAllProfiles () {
    return Object.values(this.logins).flatMap(it => it.getAllProfiles())
  }
  public getCurrentLogin () {
    const l = this.logins[__profilesModel().extraJson.loginType]
    if (l) return l
    else throw new Error('') // TODO: show a dialog
  }
}
