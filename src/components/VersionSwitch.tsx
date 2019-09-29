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
  return <Dialog className='version-switch' onClose={props.onClose} visible={props.open}>
    <ul>
      {Object
        .entries(pm.profiles)
        .map(([key, ver]) => ({ ...ver, key, lastUsed: moment(ver.lastUsed) }))
        .sort((a, b) => b.lastUsed.valueOf() - a.lastUsed.valueOf())
        .map(ver => <li key={ver.key} onClick={() => {
          pm.setSelectedVersion(ver.key)
          props.onClose()
        }}>{ver.name || noTitle}
          <span>({ver.lastVersionId === 'last-release' ? lastRelease
            : ver.lastVersionId === 'last-snapshot' ? lastSnapshot : ver.lastVersionId})</span>
          <div>{lastPlayed}: {ver.lastUsed.valueOf() ? ver.lastUsed.fromNow() : unknown}</div></li>)
      }
    </ul>
  </Dialog>
}

export default VersionSwitch
