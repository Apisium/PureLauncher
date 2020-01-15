import './empty.less'
import React from 'react'

export type Props = React.HTMLAttributes<HTMLDivElement> & { text?: string }
const Empty: React.FC<Props> = ({ text, className = '', ...props }) =>
  <div {...props} className={'pl-empty ' + className}>
    <i className='iconfont icon-minecraft' />
    <p>{text || $('No Data')}</p>
  </div>

export default Empty
