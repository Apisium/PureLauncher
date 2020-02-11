import { Downloader } from '@xmcl/installer/util'
import { download, checkUrl } from '../utils/index'

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
  OFFICAL: Object.freeze({
    name: () => $('OFFICIAL'),
    launchermeta: 'http://launchermeta.mojang.com',
    launcher: 'https://launcher.mojang.com',
    resources: 'http://resources.download.minecraft.net',
    libraries: 'https://libraries.minecraft.net',
    forge: 'https://files.minecraftforge.net/maven'
  })
})

const downloader: Downloader = {
  async downloadFileIfAbsent ({ url, destination: file }) {
    if (Array.isArray(url)) {
      for (const link of url) {
        if (await checkUrl(link)) {
          await download({ file, url: link })
          return ''
        }
      }
    } else if (await checkUrl(url)) {
      await download({ file, url })
      return ''
    }
    throw new Error('Can not resolve this file: ' + url)
  }
} as any // TODO:

export const getDownloaders = () => {
  const assets /* TODO: add type AssetsOption */ = {
    downloader // TODO:
  }
  const libraries /* TODO: add type */ = {
    downloader // TODO:
  }
  return { assets, libraries, versions: { ...assets, ...libraries } }
}

export default DownloadProviders as Record<keyof typeof DownloadProviders, DownloadProvider>
