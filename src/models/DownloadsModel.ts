import { Model } from 'use-model'
import { basename } from 'path'

interface Item { progress: number, url: string, path: string, title?: string }

let i = 0
export default class DownloadsModel extends Model {
  public list: Record<number, Item & { filename: string }> = { }
  public add (item: Item) {
    (item as any).filename = basename(item.path)
    this.list[i] = item as Item & { filename: string }
    // TODO:
    return i++
  }
  public updateProgress (id: number, progress: number) {
    if (id in this.list) this.list[id].progress = progress
  }
  public clear () {
    const list = this.list
    for (const id in list) if (list[id].progress === 100) delete list[id]
  }
}
