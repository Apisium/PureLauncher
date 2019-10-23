import { Model } from 'use-model'
import { Launcher } from '@xmcl/launch'
import ProfilesModel from './ProfilesModel'

export default class GameModel extends Model {
  public error: { code: number; signal: string } | undefined | any
  public status: 'ready' | 'launching' | 'launched'

  private profileModel = this.getModel(ProfilesModel)
  private worker: Worker = new Worker('../workers/launch.ts')

  constructor () {
    super()
    this.worker.addEventListener('message', (m) => {
      const { state, error } = m.data
      switch (state) {
        case 'error':
          this.error = error
          console.error(error)
          this.status = 'ready'
          break
        case 'launched':
          console.log('launched!')
          this.status = 'launched'
          break
        case 'exit':
          if (m.data.code !== 0) {
            this.error = ({ code: m.data.code, signal: m.data.signal })
          }
          this.status = 'ready'
          console.log('exit')
          break
      }
    })
  }
  public * launch () {
    const { extraJson, root, getCurrentProfile } = this.profileModel()
    const { javaArgs, javaPath } = extraJson

    const { accessToken = '', uuid, username, displayName, type } = getCurrentProfile()

    const option: Launcher.Option = {
      javaPath: javaPath || 'java',
      extraJVMArgs: javaArgs.split(' '),
      auth: {
        accessToken: accessToken || '',
        selectedProfile: { id: uuid, name: displayName || username },
        properties: {},
        userType: type || 'mojang' as any
      },
      gamePath: root,
      version: '1.14.4',
      extraExecOption: {
        detached: true,
        env: {}
      }
    }
    this.status = 'launching'
    this.worker.postMessage(option)

    yield new Promise((res, rej) => {
      const onceLaunch = (m: MessageEvent) => {
        const { state, error } = m.data
        switch (state) {
          case 'error':
            this.worker.removeEventListener('message', onceLaunch)
            rej(error)
            break
          case 'launched':
            this.worker.removeEventListener('message', onceLaunch)
            res()
            break
        }
      }
      this.worker.addEventListener('message', onceLaunch)
    })
  }
}
