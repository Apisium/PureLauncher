import React from 'react'
import SideBar from './SideBar'
import useRoute from './useRoute'
import { HashRouter, Redirect } from 'react-router-dom'

import Provider from './models/index'
import Home from './routes/Home'
import Settings from './routes/Settings'
import Manager from './routes/Manager'

const App: React.FC<{ ref2: React.Ref<any> }> = props => {
  const home = useRoute(Home, '/home')
  const manager = useRoute(Manager, '/manager/:type')
  const settings = useRoute(Settings, '/settings')
  return (
    <Provider>
      <HashRouter>
        <SideBar />
        <section ref={props.ref2} id='main-content'>
          {home}{settings}{manager}
          <Redirect to='/manager/versions' />
        </section>
      </HashRouter>
    </Provider>
  )
}

export default App
