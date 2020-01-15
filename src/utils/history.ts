import { createHashHistory } from 'history'
import user from './analytics'

const history = createHashHistory()
history.listen(l => user.pageView(null, l.pathname, ''))

export default history
