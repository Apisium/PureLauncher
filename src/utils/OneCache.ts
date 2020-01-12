export class OneCache <K, V> {
  public key: K = Object as any
  public value: V
  public has (key: K) { return key === this.key }
  public get (key: K) { return this.has(key) ? this.value : null }
  public set (key: K, value: V) {
    this.key = key
    this.value = value
    return this
  }
  public delete (key: K) {
    if (!this.has(key)) return false
    this.key = Object as any
    this.value = null
    return true
  }
}
