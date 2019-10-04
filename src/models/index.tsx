import { getProvider } from 'use-model'

import ProfilesModel from './ProfilesModel'
import DownloadsModel from './DownloadsModel'

export default getProvider(ProfilesModel, DownloadsModel)
