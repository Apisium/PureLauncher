import React, { useState } from 'react'
import history from '../../utils/history'
import internal, { plugins } from '../../plugin/internal'
import { uninstallPlugin } from '../../protocol/uninstaller'
import { autoNotices } from '../../utils'
import { clipboard } from 'electron'

pluginMaster.addExtensionsButton({
  title: () => $('Plugins'),
  key: 'plugins',
  onClick () { history.push('/manager/plugins') }
}, plugins.resourceInstaller)

const Plugins: React.FC = () => {
  const [deletes, setDeletes] = useState<string[]>([])
  return <div className='manager-list version-switch manager-versions'>
    <div className='list-top'>
      <span className='header no-button'>{$('Plugins')}</span>
    </div>
    <ul className='scrollable'>
      {Object.values(pluginMaster.plugins)
        .map(p => {
          const uninstallable = pluginMaster.isPluginUninstallable(p, deletes)
          return <li key={p.pluginInfo.id}>{p.pluginInfo.title()}
            <span>({p.pluginInfo.version})</span>
            <div className='time'>{p.pluginInfo?.description()}</div>
            {!internal.has(p) && <div className='buttons'>
              {p.pluginInfo.source && <button
                className='btn2'
                onClick={() => {
                  clipboard.writeText(p.pluginInfo.source)
                  notice({ content: $('Copied!') })
                }}
              >{$('Export')}</button>}
              <button
                className='btn2 danger'
                disabled={!uninstallable}
                onClick={() => uninstallable ? autoNotices(uninstallPlugin(p)).then(setDeletes) : notice({
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
