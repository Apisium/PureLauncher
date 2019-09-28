import './profile.less'
import React, { useRef, useEffect } from 'react'
import { SkinViewer, createOrbitControls, CompositeAnimation, WalkingAnimation, RotatingAnimation } from 'skinview3d'
import Dialog from 'rc-dialog'

const skinUrl = require('../assets/images/steve.png')

const Profile: React.FC<{ open: boolean, skin?: string, onClose: () => void }> = (props) => {
  const ref = useRef<HTMLDivElement>()
  const ref2 = useRef<SkinViewer>()
  useEffect(() => {
    if (!ref.current) return
    const skinViewer = new SkinViewer({
      domElement: ref.current,
      width: 200,
      height: 260,
      skinUrl
    })
    createOrbitControls(skinViewer).enableRotate = true
    const animation = new CompositeAnimation()
    animation.add(WalkingAnimation)
    animation.add(RotatingAnimation)
    skinViewer.animation = animation as any
    ref2.current = skinViewer
    return () => skinViewer.dispose()
  }, [ref.current])
  useEffect(() => void (ref2.current && (ref2.current.animationPaused = !props.open)), [props.open])
  useEffect(() => void (props.skin && (ref2.current.skinUrl = props.skin)), [props.skin])
  return <Dialog className='profile' onClose={props.onClose} visible={props.open} forceRender>
    <div className='left'>
      <div ref={ref} className='skin' />
      <div className='buttons'>
        <button className='btn btn-primary' onClick={console.log}>更换皮肤</button>
        <button className='btn btn-secondary' disabled onClick={console.log}>取消上传</button>
      </div>
    </div>
    <div className='right'>
      <span className='text'>快速切换账户:</span>
      <select>
        <option value='aaaa'>Shirasawa (正版)</option>
        <option value='bbb'>Notch (离线)</option>
      </select>
    </div>
  </Dialog>
}

export default Profile
