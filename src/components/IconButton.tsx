import './icon-button.css'
import React, { useMemo, forwardRef } from 'react'

export const images = Object.values(require('../assets/images/terracotta/*.png'))
  .sort(() => 0.5 - Math.random()) as string[]

export type Props = { title: string, icon?: string, hideFirst?: boolean } & React.HTMLAttributes<HTMLAnchorElement>

let i = 0
const IconButton: React.FC<Props> = forwardRef(({ icon, title, hideFirst, ...props }, ref) => {
  const src = useMemo(() => icon || (images[images.length <= i ? (i = 0) : i++]), [icon])
  const t = title[0].toUpperCase()
  const c = t.charCodeAt(0)
  return <a ref={ref as any} {...props} className={'icon-button ' + (props.className || '')}>
    <img data-sound alt={title} src={src} />
    {(!hideFirst || !icon) && <span
      data-sound
      className={(c >= 65 && c <= 90) || (c >= 48 && c <= 57) ? 'offset' : undefined}
    >
      {t}</span>}
    <p>{title}</p>
  </a>
})

export default IconButton
