/* eslint-disable jsx-a11y/no-static-element-interactions */
import './settings.css'
import React from 'react'
import Switch from '../components/Switch'
import ShowMore from '../components/ShowMore'
import ProfilesStore from '../models/ProfilesStore'
import { langs } from '../i18n'
import { useStore } from 'reqwq'
import { shell } from 'electron'
import { version } from '../../package.json'

const Settings: React.FC = () => {
  const pm = useStore(ProfilesStore)
  return <div className='settings'>
    <form className='pl-form'>
      <div className='group'>
        <label>{$('JAVA EXECUTABLE')}</label>
        <input
          placeholder={$('<auto>')}
          value={pm.extraJson.javaPath}
          onClick={pm.setJavaPath}
          readOnly
        />
      </div>
      <div className='group'>
        <label>{$('MAXIMUM MEMORY')}</label>
        <input
          placeholder={$('<auto>')}
          value={pm.extraJson.memory || ''}
          onChange={e => pm.setMemory(e.target.value)}
        />
      </div>
      <div className='group'>
        <label>{$('JVM ARGUMENTS')}</label>
        <input value={pm.extraJson.javaArgs} onChange={e => pm.setArgs(e.target.value)} />
      </div>
      <div className='group'>
        <label>{$('LANGUAGE')}</label>
        <select value={pm.settings.locale} onChange={e => pm.setLocate(e.target.value)}>{Object
          .entries(langs)
          .map(([key, value]) => <option value={key} key={key}>{value.$LanguageName$}</option>)}
        </select>
      </div>
      <div className='group' style={{ paddingTop: 18 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.extraJson.animation} onChange={pm.toggleAnimation} />
        <label>{$('ENABLE ANIMATION')}</label>
      </div>
      <div className='group' style={{ paddingTop: 18 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.settings.soundOn} onChange={pm.toggleSound} />
        <label>{$('ENABLE SOUND')}</label>
      </div>
      <div className='group' style={{ paddingTop: 18 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.extraJson.bmclAPI} onChange={pm.toggleBmclAPI} />
        <label>{$('ENABLE BMCLAPI')}</label>
      </div>
      <div className='group' style={{ paddingTop: 28 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.settings.showGameLog} onChange={pm.toggleShowLog} />
        <label>{$('SHOW OUTPUT LOGS')}</label>
      </div>
      {/* <div className='group' style={{ paddingTop: 28 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.extraJson.sandbox} onChange={pm.toggleSandbox} />
        <label>使用沙箱运行游戏</label>
      </div> */}
    </form>
    <ShowMore>
      <div style={{ textAlign: 'center' }}>
        <p style={{ whiteSpace: 'pre-line' }}>{$('$readme')}</p>
        <p>{$('Version')}: {version}</p>
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
