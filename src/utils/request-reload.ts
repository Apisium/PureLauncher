import P from '../models/index'
import GameStore, { STATUS } from '../models/GameStore'

export default () => { // TODO: need test!!
  if (P.getStore(GameStore).status === STATUS.READY) {
    notice({ content: $('Plugins installed! Restarting...') })
    setTimeout(() => location.reload(), 5000)
  } else {
    openConfirmDialog({ text: $('Currently, the game is launching. Please restart the game manually later to install the plugin!') })
  }
}
