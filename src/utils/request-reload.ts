import P from '../models/index'
import { remote } from 'electron'
import GameStore, { STATUS } from '../models/GameStore'

export default (isUpdate = false) => { // TODO: need test!!
  if (P.getStore(GameStore).status === STATUS.READY) {
    notice({ content: $(isUpdate
      ? 'A new version has been released, PureLauncher will restart in five seconds for installation.'
      : 'Plugins installed! Restarting...'
    ) })
    setTimeout(() => {
      if (isUpdate) {
        remote.app.relaunch()
        window.quitApp()
      } else location.reload()
    }, 5000)
  } else {
    openConfirmDialog({ text: $(isUpdate
      ? 'A new version has been released, but the game is running now. Please manually exit the launcher and game to upgrade.'
      : 'Currently, the game is launching. Please restart manually later to install the plugins!'
    ) })
  }
}
