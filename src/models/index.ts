import { getProvider } from 'use-model'

import ProfilesModel from './ProfilesModel'
import GameModel from './GameModel'

const P = getProvider(ProfilesModel, GameModel)
export default P

window.__profilesModel = P.getModel(ProfilesModel) as any
