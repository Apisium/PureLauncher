import fs from 'fs-extra'
import urlJoin from 'url-join'
import { download, checkUrl } from '../utils/index'
import { Downloader } from '@xmcl/installer/cjs/util'
import { Option } from '@xmcl/installer/cjs/minecraft'

export interface DownloadProvider {
  name (): string
  locales?: string[]
  launchermeta?: string
  launcher?: string
  resources?: string
  libraries?: string
  forge?: string
}

const DownloadProviders = Object.freeze({
  BMCLAPI: Object.freeze({
    name: () => 'BMCLAPI',
    locales: ['zh'],
    launchermeta: 'https://bmclapi2.bangbang93.com',
    launcher: 'https://bmclapi2.bangbang93.com',
    resources: 'https://bmclapi2.bangbang93.com/assets',
    libraries: 'https://bmclapi2.bangbang93.com/maven',
    forge: 'https://bmclapi2.bangbang93.com/maven'
  }),
  MCBBSAPI: Object.freeze({
    name: () => 'MCBBSAPI',
    locales: ['zh'],
    launchermeta: 'https://download.mcbbs.net',
    launcher: 'https://download.mcbbs.net',
    resources: 'https://download.mcbbs.net/assets',
    libraries: 'https://download.mcbbs.net/maven',
    forge: 'https://download.mcbbs.net/maven'
  }),
  OFFICIAL: Object.freeze({
    name: () => $('OFFICIAL'),
    launchermeta: 'http://launchermeta.mojang.com',
    launcher: 'https://launcher.mojang.com',
    resources: 'http://resources.download.minecraft.net',
    libraries: 'https://libraries.minecraft.net',
    forge: 'https://files.minecraftforge.net/maven'
  })
})

const downloadFileIfAbsent = async ({ url, destination: file }: { url: string, destination: string }) => {
  if (await fs.pathExists(file)) return
  if (Array.isArray(url)) {
    for (const link of url) {
      if (await checkUrl(link)) {
        await download({ file, url: link })
        return file
      }
    }
  } else if (await checkUrl(url)) {
    await download({ file, url })
    return file
  }
  throw new Error('Can not resolve this file: ' + url)
}
const downloader: Downloader = {
  downloadFileIfAbsent,
  async downloadFile (obj: { url: string, destination: string }) {
    if (await fs.pathExists(obj.destination)) await fs.unlink(obj.destination)
    return downloadFileIfAbsent(obj)
  }
} as any

export const getDownloaders = (): Option => {
  let isOffcical = profilesStore.extraJson.downloadProvider === 'OFFICIAL'
  const provider: DownloadProvider = DownloadProviders[profilesStore.extraJson.downloadProvider]
  if (!provider) isOffcical = true
  return {
    assetsHost: isOffcical ? undefined : [provider.resources],
    libraryHost: isOffcical && provider?.libraries ? undefined : lib => urlJoin(provider.libraries, lib.download.path),
    downloader
  }
}

export default DownloadProviders as Record<keyof typeof DownloadProviders, DownloadProvider>
