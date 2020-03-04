import fs from 'fs-extra'
import Authenticator, { registerAuthenticator, Profile, SkinChangeable } from './Authenticator'
import { genUUID, fetchJson } from '../utils/index'
import { OFFLINE_ACCOUNTS_FILE } from '../constants'

const BASE_URL = 'https://authserver.mojang.com/'
const saveFile = () => profilesStore.saveLaunchProfileJson().catch(e => {
  console.error(e)
  throw new Error($('Fail to save files!'))
})

export const YGGDRASIL = 'yggdrasil'
@registerAuthenticator({
  name: YGGDRASIL,
  title: () => $('Online Login'),
  logo: require('../assets/images/steve-head.png'),
  fields: [
    {
      name: 'email',
      title: () => $('Email'),
      inputProps: { type: 'email', required: true, autoFocus: true }
    },
    {
      name: 'password',
      title: () => $('Password'),
      inputProps: { type: 'password', required: true }
    }
  ],
  link: { name: () => $('Register'), url: () => 'https://my.minecraft.net/store/minecraft/#register' }
})
export class Yggdrasil extends Authenticator implements SkinChangeable {
  public async login (options: { email: string, password: string }) {
    const m = profilesStore
    const p = Object.values(m.authenticationDatabase)
    if (p.some(it => it.username.toLowerCase() === options.email.toLowerCase())) {
      throw new Error($('You have already logged in with this account!'))
    }
    const data = await fetchJson(BASE_URL + 'authenticate', true, {
      agent: 'Minecraft',
      username: options.email,
      password: options.password,
      clientToken: m.clientToken,
      requestUser: true
    }).catch(e => {
      console.error(e)
      throw new Error($('Network connection failed!'))
    })
    if (!data || data.error) {
      console.error(data)
      if (typeof data.error === 'string') {
        throw new Error(data.error.includes('Invalid credentials') ? $('Invalid username or password!') : data.error)
      }
      throw new Error($('Network connection failed!'))
    }
    if (!data.selectedProfile || !data.selectedProfile.id) throw new Error($('You don\'t have an online profile yet!'))
    const sp = data.selectedProfile
    if (p.flatMap(it => Object.keys(it.profiles))
      .includes(sp.id)) throw new Error($('You have already logged in with this account!'))
    m.authenticationDatabase[data.user.id] = {
      properties: [],
      username: data.user.username,
      accessToken: data.accessToken,
      profiles: { [sp.id]: { displayName: sp.name } }
    }
    m.selectedUser.account = data.user.includes
    m.selectedUser.profile = sp.id
    await saveFile()
    return data.user.id as string
  }
  public async logout (key: string) {
    console.log(key)
    const m = profilesStore
    const p = m.authenticationDatabase[key]
    if (!p) return
    const d = await fetchJson(BASE_URL + 'invalidate', true, { accessToken: p.accessToken, clientToken: m.clientToken })
      .catch(e => {
        console.error(e)
        throw new Error($('Network connection failed!'))
      })
    if (d && d.error) {
      console.error(d)
      throw new Error($('Network connection failed!'))
    }
    console.log(delete m.authenticationDatabase[key], m.authenticationDatabase[key])
    await saveFile()
  }
  public async refresh (key: string) {
    const m = profilesStore
    const p = m.authenticationDatabase[key]
    if (!p) throw new Error($('Account does not exists!'))
    const d = await fetchJson(BASE_URL + 'refresh', true, {
      clientToken: m.clientToken, accessToken: p.accessToken, requestUser: true })
      .catch(e => {
        console.error(e)
        throw new Error($('Network connection failed!'))
      })
    if (!d || d.error) {
      console.error(d)
      throw new Error($('Network connection failed!'))
    }
    const p2 = m.authenticationDatabase[key]
    p2.accessToken = d.accessToken
    p2.username = d.user.username
    p2.profiles[d.selectedProfile.id].displayName = d.selectedProfile.name
    await saveFile()
  }
  public async validate (key: string, autoRefresh: boolean) {
    const m = profilesStore
    const p = m.authenticationDatabase[key]
    if (!p) throw new Error($('Account does not exists!'))
    const d = await fetchJson(BASE_URL + 'validate', true, { clientToken: m.clientToken, accessToken: p.accessToken })
      .catch(e => {
        console.error(e)
        const err: any = new Error($('Network connection failed!'))
        err.connectFailed = true
        throw err
      })
    if (d && d.error && (!autoRefresh || !await this.refresh(key).then(() => true, () => false))) {
      delete m.authenticationDatabase[key]
      notice({ content: d.error, error: true })
      await saveFile()
      return false
    } else return true
  }
  public getData (key: string) {
    const m = profilesStore
    const p = m.authenticationDatabase[key]
    if (!p) throw new Error($('Account does not exists!'))
    const uuid = Object.keys(p.profiles)[0]
    if (!uuid) throw new Error($('Account does not exists!'))
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
    const m = profilesStore
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
  public async changeSkin (key: string, path: string, slim = false) {
    const p = this.getData(key)
    const body = new FormData()
    body.append('model', slim ? 'slim' : '')
    body.append('file', new Blob([await fs.readFile(path)]))
    const text = await fetch(`https://api.mojang.com/user/profile/${p.uuid}/skin`, {
      body,
      method: 'PUT',
      headers: { Authorization: 'Bearer ' + p.accessToken }
    }).then(it => it.text(), e => {
      console.error(e)
      throw new Error($('Network connection failed!'))
    })
    if (text?.startsWith('{')) {
      console.error(JSON.parse(text))
      throw new Error($('Network connection failed!'))
    }
  }
}

export const OFFLINE = 'Offline'
@registerAuthenticator({
  name: OFFLINE,
  title: () => $('Offline Login'),
  logo: require('../assets/images/zombie-head.png'),
  fields: [
    {
      name: 'username',
      title: () => $('Username'),
      inputProps: { required: true, pattern: '\\w{2,16}', autoFocus: true }
    }
  ]
})
export class Offline extends Authenticator {
  private db: { [key: string]: string } = fs.readJsonSync(OFFLINE_ACCOUNTS_FILE, { throws: false }) || { }
  public async login (options: { username: string }) {
    const id = genUUID('OfflinePlayer:' + options.username.toLowerCase())
    if (id in this.db) throw new Error($('Account already exists!'))
    this.db[id] = options.username
    await this.save()
    return id
  }
  public async logout (id: string) {
    delete this.db[id]
    await this.save()
  }
  public refresh (id: string) {
    this.check(id)
    return Promise.resolve()
  }
  public validate (id: string): Promise<boolean> {
    this.check(id)
    return Promise.resolve(true)
  }
  public getData (uuid: string): Profile {
    const username = this.db[uuid]
    if (!username) throw new Error($('Account does not exists!'))
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
    return fs.writeJson(OFFLINE_ACCOUNTS_FILE, this.db).catch(e => {
      console.error(e)
      throw new Error($('Save failed!'))
    })
  }
  private check (key: string) {
    if (!(key in this.db)) throw new Error('Account does not exists!')
  }
}
