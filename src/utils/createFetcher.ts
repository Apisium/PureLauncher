import Lru from './Lru'

const SUSPENSE = Symbol('Suspense')
export default <
  T extends (...args: any) => Promise<any>,
  K = Parameters<T>[0],
  V = T extends (...args: any) => Promise<infer R> ? R : never
> (
  fetch: T,
  cache: { get (key: K): V, set (key: K, value: V): any, has (key: K): boolean } = new Lru()
) => (...args: Parameters<T>): V => {
  const key = args[0]
  let v: any
  if (cache.has(key)) v = cache.get(key)
  else {
    v = fetch.apply(null, args)
    if (typeof v?.then !== 'function') throw new TypeError('Fetcher should return a Promise!')
    v.then((r: any) => (cache.set(key, r), r))
    v[SUSPENSE] = true
    cache.set(key, v)
  }
  if (v?.[SUSPENSE]) throw v
  else return v
}
