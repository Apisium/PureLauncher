import './loading.less'
import React from 'react'

export type Props = React.HTMLAttributes<HTMLDivElement> & { text?: string }
const Loading: React.FC<Props> = ({ text, className = '', ...props }) =>
  <div {...props} className={'mc-loading ' + className}>
    <div className='squares'><div /><div /><div /><div /></div>
    <p>{text || $('Loading...')}</p>
  </div>

export default Loading
