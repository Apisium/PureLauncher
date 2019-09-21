import './version-switch.less'
import React from 'react'
import Dialog from 'rc-dialog'

const VersionSwitch: React.FC<{ open: boolean, onClose: () => void }> = (props) => {
  return <Dialog className='version-switch' onClose={props.onClose} visible forceRender>
    <ul>
      <li/>
    </ul>
  </Dialog>
}

export default VersionSwitch
