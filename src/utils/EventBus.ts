export const INTERRUPTIBLE = Symbol('Interruptible')
const ONCE = Symbol('Once')
export default class EventBus {
  private map = new Map<string, Array<(...args: any[]) => any>>()
  public on (name: string, fn: (...args: any[]) => any) {
    if (typeof fn !== 'function') throw new TypeError('fn is not a function!')
    let arr = this.map.get(name)
    if (!arr) this.map.set(name, arr = [])
    arr.push(fn)
  }
  public once (name: string, fn: (...args: any[]) => any) {
    fn[ONCE] = true
    this.on(name, fn)
  }
  public off (name: string, fn: (...args: any[]) => any) {
    if (typeof fn !== 'function') throw new TypeError('fn is not a function!')
    const arr = this.map.get(name)
    if (arr) {
      const i = arr.indexOf(fn)
      if (i !== -1) {
        arr.splice(i, 1)
        if (!arr.length) this.map.delete(name)
      }
    }
  }
  public async emitSync (name: string, ...args: any[]) {
    const arr = this.map.get(name)
    if (arr) {
      for (let i = 0; i < arr.length;) {
        const fn = arr[i]
        if (fn[ONCE]) arr.splice(i, 1)
        else i++
        if (fn[INTERRUPTIBLE]) await fn.apply(null, args)
        else try { await fn.apply(null, args) } catch (e) { console.error(e) }
      }
    }
  }
  public async emit (name: string, ...args: any[]) {
    const arr = this.map.get(name)
    if (!arr) return Promise.resolve()
    const promises = []
    for (let i = 0; i < arr.length;) {
      const fn = arr[i]
      if (fn[ONCE]) arr.splice(i, 1)
      else i++
      if (fn[INTERRUPTIBLE]) promises.push(fn.apply(null, args))
      else try { promises.push(fn.apply(null, args)?.catch?.(console.error)) } catch (e) { console.error(e) }
    }
    await Promise.all(promises)
  }
}
