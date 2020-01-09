import React from 'react'
import history from '../../utils/history'
import internal, { plugins } from '../../plugin/internal'

pluginMaster.addExtensionsButton({
  title: () => $('Plugins'),
  key: 'plugins',
  onClick () { history.push('/manager/plugins') }
}, plugins.resourceInstaller)

const Plugins: React.FC = () => {
  return <div className='manager-list version-switch manager-versions'>
    <div className='list-top'>
      <span className='header no-button'>{$('Plugins')}</span>
    </div>
    <ul className='scroll-bar'>
      {Object.values(pluginMaster.plugins)
        .map(p => <li key={p.pluginInfo.id}>{p.pluginInfo.title()}
          <span>({p.pluginInfo.version})</span>
          <div className='time'>{p.pluginInfo?.description()}</div>
          {!internal.has(p) && <div className='buttons'>
            <button className='btn2'>{$('Share')}</button>
            <button className='btn2 danger' onClick={() => pluginMaster.uninstallPlugin(p)}>{$('Delete')}</button>
          </div>}
        </li>)}
    </ul>
  </div>
}

export default Plugins
