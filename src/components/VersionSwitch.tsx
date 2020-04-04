import './version-switch.less'
import React from 'react'
import Dialog from 'rc-dialog'
import ProfilesStore from '../models/ProfilesStore'
import { useStore } from 'reqwq'
import { resolveIcon } from './IconPicker'

/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
const VersionSwitch: React.FC<{ open: boolean, onClose: () => void }> = props => {
  const pm = useStore(ProfilesStore)
  const noTitle = $('No Title')
  const unknown = $('Unnamed')
  const lastPlayed = $('Last played')
  const lastRelease = $('last-release')
  const lastSnapshot = $('last-snapshot')
  return <Dialog
    animation='zoom'
    maskAnimation='fade'
    className='version-switch'
    onClose={props.onClose}
    visible={props.open}
    destroyOnClose
  >
    <ul>
      {pm.sortedVersions.map(ver => <li
        data-sound
        key={ver.key}
        className='version'
        onClick={() => {
          pm.setSelectedVersion(ver.key)
          props.onClose()
        }}
      >
        <img src={resolveIcon(ver.icon)} alt={ver.icon} className='version-icon' />
        <div className='version-text'>
          {ver.type === 'latest-release' ? lastRelease
            : ver.type === 'latest-snapshot' ? lastSnapshot : ver.name || noTitle}
          <span data-sound>({ver.lastVersionId})</span>
          <div data-sound className='time'>{lastPlayed}: {ver.lastUsed.valueOf() ? ver.lastUsed.fromNow() : unknown}</div>
        </div>
      </li>)}
    </ul>
  </Dialog>
}

export default VersionSwitch
