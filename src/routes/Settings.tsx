import './settings.less'
import React from 'react'
import Switch from '../components/Switch'

const args = '-XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 ' +
  '-XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M'

const Settings: React.FC = () => {
  return <div className='settings'>
    <form>
      <div className='group'>
        <label>Java 路径</label>
        <input placeholder='<自动>' readOnly></input>
      </div>
      <div className='group'>
        <label>最大内存</label>
        <input placeholder='<自动>'></input>
      </div>
      <div className='group' style={{ paddingTop: 18 }}>
        <Switch coverStyle={{ marginRight: 16 }} />
        <label>开启启动器音效</label>
      </div>
      <div className='group' style={{ paddingTop: 18 }}>
        <Switch coverStyle={{ marginRight: 16 }} />
        <label>使用 BMCLAPI 加速下载</label>
      </div>
      <div className='group'>
        <label>JVM 参数</label>
        <input value={args} readOnly></input>
      </div>
      <div className='group' style={{ paddingTop: 18 }}>
        <Switch coverStyle={{ marginRight: 16 }} />
        <label>显示游戏日志</label>
      </div>
    </form>
  </div>
}

export default Settings
