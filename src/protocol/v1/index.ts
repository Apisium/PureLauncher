import { Version, MinecraftLocation, MinecraftFolder } from '@xmcl/core'
import { getJson } from '../../utils'
import { Task } from '@xmcl/task'
import { downloadFileTask, CurseforgeInstaller } from '@xmcl/installer'
import { downloader } from '../../plugin/DownloadProviders'
import { ensureDir } from 'fs-extra'

export interface SimpleVersionIndicator {
    minecraft: string
    /**
     * Forge version id.
     */
    forge?: string
    /**
     * Fabric loader version
     */
    fabric?: string
    /**
     * Liteloader version id.
     */
    liteloader?: string
}

export interface Resource {
    /**
     * Path relative to <.minecraft> to deploy
     */
    path: string
    /**
     * The sha1 to verify the resource
     */
    sha1?: string
}

export interface UrlResource extends Resource {
    /**
     * The url to download the resource
     */
    url: string
}

export interface CurseforgeResource extends Resource {
    projectId: number
    fileId: number
}

export interface InstallProfile {
    version: Version | SimpleVersionIndicator | string
    resources: Resource[]
}

export interface InstallProfileManifest {
    name: string
    author: string
    email: string
    version: string
    description: string
}

export interface SubscriptionData {
    url: string
    profile: InstallProfile | undefined
    manifest: InstallProfileManifest | undefined
}

export class Subscription implements SubscriptionData {
    readonly url: string
    private _profile: InstallProfile | undefined
    private _manfiest: InstallProfileManifest | undefined

    constructor (subscription: SubscriptionData) {
      this.url = subscription.url
      this._profile = subscription.profile
      this._manfiest = subscription.manifest
    }

    get profile () { return this._profile }
    get manifest () { return this._manfiest }

    async update (): Promise<void> {
      const { manifest, profile } = await getJson<{ manifest: InstallProfileManifest, profile: InstallProfile }>(this.url)
      this._manfiest = manifest
      this._profile = profile
    }

    toJSON () {
      return { url: this.url, manifest: this.manifest, profile: this.profile }
    }
}

export function installTask (minecraft: MinecraftLocation, profile: InstallProfile) {
  const folder = MinecraftFolder.from(minecraft)
  return Task.create('install', async (ctx) => {
    await ensureDir(folder.root)
    const tasks = profile.resources.map((r) => {
      const destination = folder.getPath(r.path)
      if ('url' in r) {
        const urlRes = r as UrlResource
        return Task.create('resource', downloadFileTask({
          destination,
          url: urlRes.url,
          checksum: urlRes.sha1 ? { algorithm: 'sha1', hash: urlRes.sha1 } : undefined
        }, { downloader }))
      } else if ('fileId' in r && 'projectId' in r) {
        const curseforgeRes = r as CurseforgeResource
        return CurseforgeInstaller.installCurseforgeFileTask({ fileID: curseforgeRes.fileId, projectID: curseforgeRes.projectId }, destination, { downloader })
      }
      return undefined
    })
    ctx.update(0, profile.resources.length)
    await Promise.all(tasks.filter((t) => !!t).map(t => ctx.execute(t, 1)))
  })
}
