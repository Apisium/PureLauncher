import { getProvider } from 'use-model'

import ProfilesModel from './ProfilesModel'
import DownloadsModel from './DownloadsModel'

const P = getProvider(ProfilesModel, DownloadsModel)
export default P

window.__profilesModel = P.getModel(ProfilesModel) as any
