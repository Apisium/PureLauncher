import './list.less'
import React from 'react'

const Versions: React.FC = () => {
  return <ul className='manager-list'>
    <li className='list-top'>
      <a className='add-version'><i className='iconfont icon-shuliang-zengjia_o' /><span>添加新的版本</span></a>
    </li>
  </ul>
}

export default Versions
