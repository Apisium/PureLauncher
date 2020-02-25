import React from 'react'
import ProfilesStore from '../models/ProfilesStore'
import { useStore } from 'reqwq'
import { InstallView } from '../protocol/types'

const css1 = { display: 'flex', alignItems: 'center', marginTop: 4 }
const css2 = { marginLeft: 8, flex: 1, maxWidth: 360 }
export default (o: InstallView, ps?: ProfilesStore, prop: string | number | symbol = 'selectedVersion') => {
  const key = (o as any)[prop] = profilesStore.selectedVersion.key
  const Render = o.render
  return (() => {
    const lastRelease = $('last-release')
    const lastSnapshot = $('last-snapshot')
    if (!ps) ps = useStore(ProfilesStore)
    const vers = ps.sortedVersions
    const [u, set] = React.useState(key)
    return <>
      {Render && <Render />}
      <p style={css1}>
        <span>{$('Target Version')}: </span>
        <select value={u} onChange={e => set((o as any)[prop] = e.target.value)} style={css2}>
          {vers.map(it =>
            <option value={it.key} key={it.key}>{it.type === 'latest-release' ? lastRelease
              : it.type === 'latest-snapshot' ? lastSnapshot
                : it.name || it.lastVersionId} ({it.lastVersionId})
            </option>)}
        </select>
      </p>
    </>
  }) as React.FC
}
