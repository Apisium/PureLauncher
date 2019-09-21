import './settings.less'
import React from 'react'
import Switch from '../components/Switch'
import ShowMore from '../components/ShowMore'
import ProfilesModel from '../models/ProfilesModel'
import { useModel } from 'use-model'

const Settings: React.FC = () => {
  const pm = useModel(ProfilesModel)
  return <div className='settings'>
    <form>
      <div className='group'>
        <label>Java 路径</label>
        <input
          placeholder='<自动>'
          value={pm.extraJson.javaPath}
          onClick={pm.setJavaPath}
          readOnly
        />
      </div>
      <div className='group'>
        <label>最大内存</label>
        <input
          placeholder='<自动>'
          value={pm.extraJson.memory || ''}
          onChange={e => pm.setMemory(e.target.value)}
        />
      </div>
      <div className='group'>
        <label>JVM 参数</label>
        <input value={pm.extraJson.javaArgs} onChange={e => pm.setArgs(e.target.value)}/>
      </div>
      <div className='group' style={{ paddingTop: 18 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.extraJson.animation} onChange={pm.toggleAnimation} />
        <label>开启启动器动画</label>
      </div>
      <div className='group' style={{ paddingTop: 18 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.settings.soundOn} onChange={pm.toggleSound} />
        <label>开启启动器音效</label>
      </div>
      <div className='group' style={{ paddingTop: 18 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.extraJson.bmclAPI} onChange={pm.toggleBmclAPI} />
        <label>使用 BMCLAPI 加速下载</label>
      </div>
      <div className='group' style={{ paddingTop: 18 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.settings.showGameLog} onChange={pm.toggleShowLog} />
        <label>显示游戏日志</label>
      </div>
      <div className='group' style={{ paddingTop: 18 }}>
        <Switch coverStyle={{ marginRight: 16 }} checked={pm.extraJson.sandbox} onChange={pm.toggleSandbox} />
        <label>使用沙箱运行游戏</label>
      </div>
    </form>
    <ShowMore>
      <div>
        <p>是一款基于 MIT 协议开源的 Minecraft 启动器, 只为您的舒适而精心设计.</p>
      </div>
    </ShowMore>
  </div>
}

export default Settings
