import { getProvider } from 'use-model'

import ProfilesModel from './ProfilesModel'

const P = getProvider(ProfilesModel)
export default P

window.__profilesModel = P.getModel(ProfilesModel) as any
