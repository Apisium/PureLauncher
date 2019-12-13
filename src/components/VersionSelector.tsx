import React from 'react'
import ProfilesStore from '../models/ProfilesStore'
import { useStore } from 'reqwq'
import { InstallView } from '../protocol/types'

export default (o: InstallView, prop: string | number | symbol = 'selectedVersion') => {
  (o as any)[prop] = profilesStore.selectedVersion.key
  const Render = o.render
  return (() => {
    const lastRelease = $('last-release')
    const lastSnapshot = $('last-snapshot')
    const ps = useStore(ProfilesStore)
    const vers = ps.sortedVersions
    const [u, set] = React.useState(vers[0] ? vers[0].key : '')
    return <>
      {Render && <Render />}
      <p style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
        <span>{$('Target Version')}: </span>
        <select
          value={u}
          onChange={e => set((o as any)[prop] = e.target.value)}
          style={{ marginLeft: 8, flex: 1 }}
        >
          {vers.map(it =>
            <option value={it.key} key={it.key}>{it.type === 'latest-release' ? lastRelease
              : it.type === 'latest-snapshot' ? lastSnapshot
                : it.name || it.lastVersionId} ({it.lastVersionId})</option>)}
        </select>
      </p>
    </>
  }) as React.FC
}
