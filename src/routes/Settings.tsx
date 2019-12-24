import './settings.less'
import React from 'react'
import Switch from '../components/Switch'
import ShowMore from '../components/ShowMore'
import ProfilesStore from '../models/ProfilesStore'
import { langs } from '../i18n'
import { useStore } from 'reqwq'

const Settings: React.FC = () => {
  const pm = useStore(ProfilesStore)
  return <div className='settings'>
    <form>
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
      <div>
        <p>PureLauncher 是一款基于 MIT 协议开源的 Minecraft 启动器, 只为您的舒适而精心设计.</p>
      </div>
    </ShowMore>
  </div>
}

export default Settings
