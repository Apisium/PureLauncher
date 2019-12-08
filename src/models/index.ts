import { newInstance } from 'reqwq'

import ProfilesStore from './ProfilesStore'
import GameStore from './GameStore'

const P = newInstance(ProfilesStore, GameStore)
export default P

window.__getStore = P.getStore
window.profilesStore = P.getStore(ProfilesStore)
