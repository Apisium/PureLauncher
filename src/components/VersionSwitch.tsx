import './version-switch.less'
import React from 'react'
import Dialog from 'rc-dialog'
import moment from 'moment'
import ProfileModel from '../models/ProfilesModel'
import { useModel } from 'use-model'

const VersionSwitch: React.FC<{ open: boolean, onClose: () => void }> = (props) => {
  const pm = useModel(ProfileModel)
  const noTitle = $('No Title')
  const unknown = $('Unknown')
  const lastPlayed = $('Last played')
  const lastRelease = $('last-release')
  const lastSnapshot = $('last-snapshot')
  return <Dialog
    animation='zoom'
    maskAnimation='fade'
    className='version-switch'
    onClose={props.onClose}
    visible={props.open}
  >
    <ul>
      {Object
        .entries(pm.profiles)
        .filter(([_, ver]) => ver.type !== 'latest-snapshot' || pm.settings.enableSnapshots)
        .map(([key, ver]) => ({ ...ver, key, lastUsed: moment(ver.lastUsed) }))
        .sort((a, b) => b.lastUsed.valueOf() - a.lastUsed.valueOf())
        .map(ver => <li data-sound key={ver.key} onClick={() => {
          pm.setSelectedVersion(ver.key)
          props.onClose()
        }}>{ver.type === 'latest-release' ? lastRelease
        : ver.type === 'latest-snapshot' ? lastSnapshot : ver.name || noTitle}
          <span data-sound>({ver.lastVersionId})</span>
          <div data-sound>{lastPlayed}: {ver.lastUsed.valueOf() ? ver.lastUsed.fromNow() : unknown}</div></li>)
      }
    </ul>
  </Dialog>
}

export default VersionSwitch
