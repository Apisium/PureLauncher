import urlJoin from 'url-join'
import { Option } from '@xmcl/installer/minecraft'
import { setDownloader, DefaultDownloader, DownloadToOption } from '@xmcl/installer/util'

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

class ProgressDownloader extends DefaultDownloader {
  public bytes = 0
  public downloadFile (option: DownloadToOption) {
    const fn = option.progress
    option.progress = (c, w, t, u) => {
      this.bytes += c
      if (!Number.isSafeInteger(this.bytes)) this.bytes = 0
      __updateTasksView()
      if (fn) return fn(c, w, t, u)
    }
    return super.downloadFile(option)
  }
}

export const downloader = new ProgressDownloader()

setDownloader(downloader)

export const getDownloaders = (): Option => {
  let isOffcical = profilesStore.extraJson.downloadProvider === 'OFFICIAL'
  const provider: DownloadProvider = DownloadProviders[profilesStore.extraJson.downloadProvider]
  if (!provider) isOffcical = true
  return {
    assetsDownloadConcurrency: profilesStore.extraJson.downloadThreads || 16,
    assetsHost: isOffcical ? undefined : [provider.resources],
    libraryHost: isOffcical && provider?.libraries ? undefined : lib => urlJoin(provider.libraries, lib.download.path)
  }
}

export default DownloadProviders as Record<keyof typeof DownloadProviders, DownloadProvider>
