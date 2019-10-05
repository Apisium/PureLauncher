import { Model } from 'use-model'
import { resolve } from 'path'
import ProfilesModel from './ProfilesModel'
import { Launcher } from '@xmcl/launch'

export default class GameModel extends Model {
  private profileModel = this.getModel(ProfilesModel)
  private worker: Worker = new Worker('../workers/launch.ts')

  constructor () {
    super()
    this.worker.addEventListener('message', (m) => {
      const { state, error } = m.data
      switch (state) {
        case 'error':
          console.error(error)
          break
        case 'launched':
          console.log('launched!')
          break
        case 'exit':
          console.log('exit')
          break
      }
    })
  }
  public * launch () {
    const { extraJson, authenticationDatabase, selectedUser, root } = this.profileModel()
    const { javaArgs, javaPath } = extraJson
    const { accessToken = '', profiles: userProfiles = {}, properties = {} }
      = authenticationDatabase[selectedUser.account] || { }

    const userProfile = userProfiles[selectedUser.profile] || { displayName: 'Steve' }

    const option: Launcher.Option = {
      javaPath: javaPath || 'java',
      extraJVMArgs: javaArgs.split(' '),
      auth: {
        accessToken: accessToken || '',
        selectedProfile: { id: selectedUser.profile || '', name: userProfile.displayName },
        properties: properties[0],
        userType: 'mojang' as any
      },
      gamePath: root,
      version: '1.14.4',
      extraExecOption: {
        detached: true,
        env: {}
      }
    }
    this.worker.postMessage(option)
  }
}
