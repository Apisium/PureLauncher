import { plugin, Plugin, event } from '../Plugin'
import { version } from '../../../package.json'
import { download, genId, appDir, getJson } from '../../utils/index'
import { remote } from 'electron'
import { join } from 'path'
import { createHash } from 'crypto'
import { useStore } from 'reqwq'
import pAll from 'p-all'
import fs from 'fs-extra'
import React from 'react'
import ProfilesStore from '../../models/ProfilesStore'
import * as T from '../../protocol/types'

@plugin({ id: '@pure-launcher/resource-installer', version, description: $("PureLauncher's built-in plugin") })
export default class ResourceInstaller extends Plugin {
  @event()
  public async protocolInstallProcess (r: T.AllResources | T.ResourceVersion, o?: T.InstallView) {
    if (!o) return
    switch (r.type) {
      case 'Mod': {
        const Render = o.render
        o.selectedVersion = ''
        o.render = () => {
          const lastRelease = $('last-release')
          const lastSnapshot = $('last-snapshot')
          const ps = useStore(ProfilesStore)
          const vers = ps.sortedVersions
          const [u, set] = React.useState(vers[0] ? vers[0].key : '')
          return <>
            {Render && <Render />}
            <select value={u} onChange={e => set(o.selectedVersion = e.target.value)}>
              {vers.map(it =>
                <option value={it.key} key={it.key}>{it.type === 'latest-release' ? lastRelease
                  : it.type === 'latest-snapshot' ? lastSnapshot
                    : it.name || it.lastVersionId} ({it.lastVersionId})</option>)}
            </select>
          </>
        }
        break
      }
      case 'Version':
        if (r.resources) {
          await pAll(Object.entries(r.resources).map(([key, v]) => typeof v === 'string' &&
            (() => getJson(v).then(it => (r.resources[key] = it)))).filter(Boolean), { concurrency: 8 })
        }
    }
  }
  @event(null, true)
  public async protocolInstallResource (r: T.AllResources | T.ResourceVersion, o: T.InstallView) {
    switch (r.type) {
      case 'Server':
        await this.installServer(r)
        break
      case 'Mod':
        await this.installMod(r, o)
        break
      case 'ResourcesPack':
        await this.installResourcePack(r)
        break
      case 'Plugin':
        // TODO:
        break
      case 'Version':
        await this.installVersion(r)
        break
    }
  }

  public async installServer (r: T.ResourceServer) {
  }

  public async installVersion (r: T.ResourceVersion) {
  }

  public async installResourcePack (r: T.ResourceResourcesPack) {
    let ext = r.extends
    if (ext) {
      if (typeof ext === 'string') ext = await getJson(ext)
      await pluginMaster.emitSync('protocolInstallProcess', ext)
      await this.installResourcePack(ext as T.ResourceResourcesPack)
    }
    const p = await this.makeTempDir()
    const urls: Array<{ url: string, file: string }> = r.urls.map((url, it) => ({ url, file: join(p, it.toString()) }))
    try {
      await download(urls[0], r.title || r.id)
      const hashes = await pAll(urls.map((it, i) => () => new Promise<string>((resolve, e) => {
        const s = createHash('sha1').setEncoding('hex')
        fs.createReadStream(it.file).on('error', e).pipe(s).on('error', e).on('finish', () => {
          const hash = s.read() as string
          if (!r.hashes || hash === r.hashes[i]) resolve(hash)
          else e(new Error($('Hash is different: {0} -> {1}', hash, r.hashes[i])))
        })
      })), { concurrency: 6 })
      const dir = join(profilesStore.root, 'resourcepacks')
      await fs.ensureDir(dir)
      await pAll(urls.map((it, i) => () => {
        const path = join(dir, hashes[i] + '.zip')
        return fs.pathExists(path).then(t => t && fs.remove(path)).then(() => fs.rename(it.file, path))
      }), { concurrency: 8 })
      const jsonPath = join(appDir, 'resources/resource-pack-index.json')
      let json = { }
      try { json = await fs.readJson(jsonPath) } catch (e) { }
      if (!json || typeof json !== 'object') json = { }
      r.hashes = hashes
      json[r.id] = r
      await fs.outputJson(jsonPath, json)
    } finally {
      await fs.remove(p).catch(console.error)
    }
  }

  public async installMod (r: T.ResourceMod, o: T.InstallView) {
    console.log(r, o)
    let ext = r.extends
    if (ext) {
      if (typeof ext === 'string') ext = await getJson(ext)
      await pluginMaster.emitSync('protocolInstallProcess', ext)
      await this.installMod(ext as T.ResourceMod, o)
    }
    const p = await this.makeTempDir()
    try {
    } finally {
      await fs.remove(p).catch(console.error)
    }
  }

  private async makeTempDir () {
    const p = join(remote.app.getPath('temp'), genId())
    await fs.mkdir(p)
    return p
  }
}
