import './icon-button.css'
import React, { useMemo } from 'react'

export const images = Object.values(require('../assets/images/terracotta/*.png'))
  .sort(() => 0.5 - Math.random()) as string[]

export type Props = { title: string, icon?: string } & React.HTMLAttributes<HTMLAnchorElement>

let i = 0
const IconButton: React.FC<Props> = ({ icon, title, ...props }) => {
  const src = useMemo(() => icon || (images[images.length <= i ? (i = 0) : i++]), [icon])
  return <a {...props} className={'icon-button ' + (props.className || '')}>
    <img alt={title} src={src} />
    {!icon && <span>{title[0]}</span>}
    <p>{title}</p>
  </a>
}

export default IconButton
