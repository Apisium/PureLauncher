import React, { useState } from 'react'
import history from '../../utils/history'
import internal, { plugins } from '../../plugin/internal'
import { Plugin } from '../../plugin/Plugin'

pluginMaster.addExtensionsButton({
  title: () => $('Plugins'),
  key: 'plugins',
  onClick () { history.push('/manager/plugins') }
}, plugins.resourceInstaller)

const Plugins: React.FC = () => {
  const [deletes, setDeletes] = useState<string[]>([])
  const uninstallPlugin = (p: Plugin) => {
    pluginMaster.uninstallPlugin(p).then(setDeletes).catch()
  }
  return <div className='manager-list version-switch manager-versions'>
    <div className='list-top'>
      <span className='header no-button'>{$('Plugins')}</span>
    </div>
    <ul className='scroll-bar'>
      {Object.values(pluginMaster.plugins)
        .map(p => {
          const uninstallable = pluginMaster.isPluginUninstallable(p, deletes)
          return <li key={p.pluginInfo.id}>{p.pluginInfo.title()}
            <span>({p.pluginInfo.version})</span>
            <div className='time'>{p.pluginInfo?.description()}</div>
            {!internal.has(p) && <div className='buttons'>
              <button className='btn2'>{$('Share')}</button>
              <button
                className='btn2 danger'
                disabled={!uninstallable}
                onClick={() => uninstallable ? uninstallPlugin(p) : notice({
                  content: $('The plugin cannot be uninstalled because it is dependent on other plugins!')
                })}
              >{$(uninstallable ? 'Delete' : 'Unavailable')}</button>
            </div>}
          </li>
        })}
    </ul>
  </div>
}

export default Plugins
