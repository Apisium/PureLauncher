const ctx = new OffscreenCanvas(0, 0).getContext('2d')

export default (text: string, width: number, max = 100) => {
  const font = getComputedStyle(document.body).fontFamily
  let size = 20
  ctx.font = size + 'px ' + font
  if (ctx.measureText(text).width > width) {
    do {
      ctx.font = (--size) + 'px ' + font
    } while (size > 1 && ctx.measureText(text).width > width)
  } else {
    do {
      ctx.font = (++size) + 'px ' + font
    } while (size < max && ctx.measureText(text).width < width)
    size--
  }
  return size
}
