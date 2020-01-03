import React from 'react'
import history from '../../utils/history'

pluginMaster.addExtensionsButton({
  title: () => $('Plugins'),
  key: 'plugins',
  onClick () { history.push('/manager/plugins') }
})

const Plugins: React.FC = () => {
  return <div />
}

export default Plugins
