/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
import './icon-picker.css'
import React from 'react'
import Dialog from 'rc-dialog'

export const icons: Record<string, string> = require('../assets/images/icons/*.png')
export const resolveIcon = (url: string): string => url in icons ? icons[url] : typeof url === 'string' &&
  url.startsWith('data:') ? url : icons.Grass

const IconPicker: React.FC<{ open: boolean, onClose: (icon: string | null) => void }> = p => {
  return <Dialog
    animation='zoom'
    maskAnimation='fade'
    className='icon-picker scrollable-dialog'
    title={$('Please select an icon you like:')}
    onClose={() => p.onClose(null)}
    visible={p.open}
  >
    <div className='icons'>
      {Object.entries(icons).map(([key, value]) =>
        <img className='version-icon' role='button' key={key} onClick={() => p.onClose(key)} alt={key} src={value} />)}
    </div>
  </Dialog>
}
export default IconPicker
