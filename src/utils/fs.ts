import { promises as fs } from 'original-fs'

export const move = (path: string, dest: string) => fs.rename(path, dest).catch(e => {
  if (e?.code !== 'EXDEV') throw e
  return fs.copyFile(path, dest).then(() => fs.unlink(path))
})
