module.exports = b => {
  if (process.env.NODE_ENV === 'production') b.addPackager('js', require.resolve('./JSPackager'))
}
