export interface L <K, V> {
  get (key: K): V
  set (key: K, value: V): this
  delete (key: K): boolean
  has (key: K): boolean
}

export default (function Lru <K = unknown, V = unknown> (maxSize = 50) {
  let cache = new Map<K, V>()
  let oldCache = new Map<K, V>()
  let i = 0
  const update = (key: K, value: V) => {
    cache.set(key, value)
    if (++i >= maxSize) {
      oldCache = cache
      cache = new Map<K, V>()
      i = 0
    }
  }
  this.get = (key: K) => {
    if (cache.has(key)) return cache.get(key)
    if (oldCache.has(key)) {
      const v = oldCache.get(key)
      oldCache.delete(key)
      update(key, v)
      return v
    }
  }
  this.set = (key: K, value: V) => {
    if (cache.has(key)) cache.set(key, value)
    else update(key, value)
    return this
  }
  this.has = (key: K) => cache.has(key) || oldCache.has(key)
  this.delete = (key: K) => {
    const d = cache.delete(key)
    if (d) i--
    return oldCache.delete(key) || d
  }
}) as any as ({ new <K = unknown, V = unknown> (maxSize?: number): L<K, V> })
