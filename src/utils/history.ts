import { createHashHistory } from 'history'
import user from './analytics'

const history = createHashHistory()
history.listen(l => user.pageView(l.pathname).catch(console.error))

export default history
