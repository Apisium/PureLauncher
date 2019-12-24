export default global['__D' + 'EV__'] = Boolean((typeof __DEV__ === 'boolean' && __DEV__) || !!process.env.DEV || process.env.NODE_ENV !== 'production')
process.env['NODE_' + 'ENV'] = process.env.NODE_ENV
