import { Store, injectStore } from 'reqwq'
import { Launcher } from '@xmcl/launch'
import ProfilesStore from './ProfilesStore'

export default class GameStore extends Store {
  public error: { code: number, signal: string } | undefined | any
  public status: 'ready' | 'launching' | 'launched'

  @injectStore(ProfilesStore)
  private profilesStore: ProfilesStore
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
  public async launch (version?: string) {
    const { extraJson, root, getCurrentProfile, selectedVersion } = this.profilesStore
    const { javaArgs, javaPath } = extraJson

    const { accessToken = '', uuid, username, displayName, type } = getCurrentProfile()

    if (!version) {
      version = selectedVersion.lastVersionId
      switch (selectedVersion.type) {
        case 'latest-release':
        case 'latest-snapshot':
          version = selectedVersion.type
      }
    }

    switch (version) {
      case 'latest-release':
        // TODO: Get the right version and download
        break
      case 'latest-snapshot':
        // TODO: Get the right version and download
        break
      default:
        // TODO: Check if version exists.
    }

    const option: Launcher.Option = {
      version,
      javaPath: javaPath || 'java',
      extraJVMArgs: javaArgs.split(' '),
      auth: {
        accessToken: accessToken || '',
        selectedProfile: { id: uuid, name: displayName || username },
        properties: {},
        userType: type || 'mojang' as any
      },
      gamePath: root,
      extraExecOption: {
        detached: true,
        env: {}
      }
    }
    this.status = 'launching'
    this.worker.postMessage(option)

    await new Promise((res, rej) => {
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
