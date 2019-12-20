const f = (typeof window !== 'undefined' && window.fetch) ||
  (typeof global !== 'undefined' && global.fetch) || (typeof self !== 'undefined' && self.fetch) ||
  this.fetch || eval('require && require("node-fetch")')
if (!f) throw new Error('Can not find the fetch function.')

let PORT = 46781
export const post = (url, body) => f(`http://127.0.0.1:${PORT}/${url}`,
  { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } })
  .then(it => it.json())

export const setPort = port => { PORT = port }
export const geyPort = () => PORT
export const reload = () => f(`http://127.0.0.1:${PORT}/reload`).then(it => it.json()).then(it => it.success)
export const info = () => f(`http://127.0.0.1:${PORT}/info`).then(it => it.json())
export const protocol = data => post('protocol', data)
