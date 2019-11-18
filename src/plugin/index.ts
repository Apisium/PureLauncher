import Authenticator from './Authenticator'
import { YGGDRASIL, OFFLINE, Yggdrasil, Offline } from './logins'

export default class Master {
  public logins: { [type: string]: Authenticator } = { [YGGDRASIL]: new Yggdrasil(), [OFFLINE]: new Offline() }
  public getAllProfiles () {
    return Object.values(this.logins).flatMap(it => it.getAllProfiles())
  }
  public getCurrentLogin () {
    const l = this.logins[__profilesStore.extraJson.loginType]
    if (l) return l
    else throw new Error('') // TODO: show a dialog
  }
}
