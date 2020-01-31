import * as resolveP from 'resolve-path'
import { resolve, extname } from 'path'

export const DEFAULT_EXT_FILTER = ['exe', 'com']
export default (parent: string, path: string, filter = DEFAULT_EXT_FILTER) => {
  /* eslint-disable no-control-regex */
  if (/[<>:"|?*\x00-\x1F]/.test(name) || path.length > 255 || filter.includes(extname(name))) {
    throw new Error(`The file name (${name}) is illegal.`)
  }
  return resolveP(resolve(parent), path) as string
}
