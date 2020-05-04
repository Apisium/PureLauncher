/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import './settings.css'
import React from 'react'
import Switch from '../components/Switch'
import ShowMore from '../components/ShowMore'
import ProfilesStore from '../models/ProfilesStore'
import DownloadProviders from '../plugin/DownloadProviders'
import { langs } from '../i18n'
import { useStore } from 'reqwq'
import { shell, remote } from 'electron'
import { version } from '../../package.json'
import { DEFAULT_LOCATE } from '../constants'

let i = 0
let timer: NodeJS.Timeout
const Settings: React.FC = () => {
  const pm = useStore(ProfilesStore)
  const recommend = ` (${$('Recommend')})`
  return <div className='settings'>
    <form className='pl-form'>
      <div className='group'>
        <label>{$('JAVA EXECUTABLE')}</label>
        <input
          style={{ cursor: 'pointer' }}
          placeholder={$('<auto>')}
          value={pm.extraJson.javaPath}
          onClick={pm.setJavaPath}
          readOnly
        />
      </div>
      <div className='group'>
        <label>{$('MAXIMUM MEMORY')}</label>
        <input
          type='number'
          placeholder={$('<auto>')}
          value={pm.extraJson.memory || ''}
          onKeyPress={e => !/[\d]/.test(e.key) && e.preventDefault()}
          onChange={e => pm.setMemory(e.target.value)}
        />
      </div>
      <div className='group'>
        <label>{$('JVM ARGUMENTS')}</label>
        <input value={pm.extraJson.javaArgs} onChange={e => pm.setArgs(e.target.value)} />
      </div>
      <div className='group'>
        <label>{$('DOWNLOAD THREADS')}</label>
        <input
          type='number'
          value={pm.extraJson.downloadThreads || 16}
          onKeyPress={e => !/[\d]/.test(e.key) && e.preventDefault()}
          onChange={e => pm.setDownloadThreads(parseInt(e.target.value) || 16)}
        />
      </div>
      <div className='group'>
        <label>{$('LANGUAGE')}</label>
        <select value={pm.settings.locale} onChange={e => pm.setLocate(e.target.value)}>{Object
          .entries(langs)
          .map(([key, value]) => <option value={key} key={key}>{value.$LanguageName$}</option>)}
        </select>
      </div>
      <div className='group'>
        <label>{$('DOWNLOAD PROVIDER')}</label>
        <select value={pm.extraJson.downloadProvider} onChange={e => pm.setDownloadProvider(e.target.value)}>{Object
          .entries(DownloadProviders)
          .map(([key, value]) => <option value={key} key={key}>{value.name() +
            (value.locales?.some(l => DEFAULT_LOCATE.startsWith(l)) ? recommend : '')}</option>)}
        </select>
      </div>
      <div className='group' style={{ paddingTop: 18 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.extraJson.animation} onChange={pm.toggleAnimation} />
        <label>{$('ENABLE ANIMATION')}</label>
      </div>
      <div className='group' style={{ paddingTop: 18 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.extraJson.soundOn} onChange={pm.toggleSound} />
        <label>{$('ENABLE SOUND')}</label>
      </div>
      <div className='group' style={{ paddingTop: 24 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.extraJson.copyMode} onChange={pm.toggleCopyMode} />
        <label>{$('COPY URL MODE')}</label>
      </div>
      <div className='group' style={{ paddingTop: 24 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.settings.enableSnapshots} onChange={pm.toggleSnapshots} />
        <label>{$('ENABLE SNAPSHOTS')}</label>
      </div>
      <div className='group' style={{ paddingTop: 28 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.settings.showGameLog} onChange={pm.toggleShowLog} />
        <label>{$('SHOW OUTPUT LOGS')}</label>
      </div>
      <div className='group' style={{ paddingTop: 28 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.extraJson.noChecker} onChange={pm.toggleNoChecker} />
        <label>{$('FORCE LAUNCH')}</label>
      </div>
      {React.createElement(React.Fragment, null, ...pluginMaster.settings)}
    </form>
    <ShowMore>
      <div style={{ textAlign: 'center' }}>
        <p style={{ whiteSpace: 'pre-line' }}>{$('$readme')}</p>
        <p
          onClick={() => {
            i++
            if (!timer) {
              timer = setTimeout(() => {
                if (i > 4) remote.getCurrentWebContents().openDevTools({ mode: 'detach' })
                i = 0
                timer = null
              }, 1000)
            }
          }}>{$('Version')}: {version}</p>
        <p>{$('Official Website')}:&nbsp;
          <a
            onClick={() => shell.openExternal('https://p.apisium.cn')}
            role='link'
          >p.apisium.cn</a>
        </p>
        <p>{$('Source Code')}:&nbsp;
          <a
            onClick={() => shell.openExternal('https://github.com/Apisium/PureLauncher')}
            role='link'
          >github.com/Apisium/PureLauncher</a>
        </p>
        <p>{$('Tencent QQ Group')}:&nbsp;
          <a
            onClick={() => shell.openExternal('https://jq.qq.com/?_wv=1027&k=5lSLiII')}
            role='link'
          >7923302</a>
        </p>
        <p>{$('Telegram Group')}:&nbsp;
          <a
            onClick={() => shell.openExternal('https://t.me/PureLauncher')}
            role='link'
          >t.me/PureLauncher</a>
        </p>
      </div>
    </ShowMore>
  </div>
}

export default Settings
