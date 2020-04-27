import './profile.less'
import React, { useRef, useEffect, useState } from 'react'
import { join } from 'path'
import { useStore } from 'reqwq'
import { remote } from 'electron'
import { promises as fs } from 'fs'
import { SKINS_PATH } from '../constants'
import { cacheSkin, autoNotices } from '../utils/index'
import { isSlimSkin, loadSkinToCanvas } from 'skinview-utils'
import { TITLE, SkinChangeable } from '../plugin/Authenticator'
import { SkinViewer, createOrbitControls, WalkingAnimation, RotatingAnimation } from 'skinview3d'
import Dialog from 'rc-dialog'
import ProfilesStore from '../models/ProfilesStore'

const skinUrl = require('../assets/images/steve.png')

const Profile: React.FC<{ open: boolean, onClose: () => void }> = props => {
  const ref = useRef<HTMLDivElement>()
  const ref2 = useRef<any>()
  const ref3 = useRef<boolean>(false)
  const pm = useStore(ProfilesStore)
  const u = pm.getCurrentProfile()
  const [skin, setSkin] = useState('')
  useEffect(() => {
    let skinViewer: SkinViewer
    process.nextTick(() => {
      const elm = document.getElementById('skin-viewer')
      if (!elm) return
      skinViewer = new SkinViewer({
        skinUrl,
        domElement: elm,
        width: 200,
        height: 260
      })
      createOrbitControls(skinViewer).enableRotate = true
      skinViewer.animations.add(WalkingAnimation)
      skinViewer.animations.add(RotatingAnimation)
      ref2.current = skinViewer
    })
    return () => { try { skinViewer.dispose() } catch { } }
  }, [props.open, ref.current])
  useEffect(() => {
    if (ref2.current && !props.open) {
      try { ref2.current.dispose() } catch { }
      ref2.current = null
    }
  }, [props.open])
  useEffect(() => {
    process.nextTick(() => {
      if (ref2.current) {
        if (skin) ref2.current.skinUrl = skin + '?' + pm.i
        else if (u) {
          const path = join(SKINS_PATH, u.key + '.png')
          fs.stat(path)
            .then(it => {
              if (it.isFile()) ref2.current.skinUrl = path + '?' + pm.i
              else throw new Error('')
            }, () => (ref2.current.skinUrl = skinUrl))
        } else ref2.current.skinUrl = skinUrl
      }
    })
  }, [u, skin, pm.i])
  const l = u && pluginMaster.logins[u.type]
  const [loading, setLoading] = useState(false)
  const handleSkinChange = () => {
    setLoading(true)
    if (skin) {
      const p = u
      if (!('changeSkin' in l)) {
        notice({ content: $('Failed!'), error: true })
        setSkin('')
        setLoading(false)
        return
      }
      (l as SkinChangeable).changeSkin(p.key, skin, ref3.current)
        .then(() => cacheSkin(p))
        .then(() => notice({ content: $('Success!') }))
        .catch((e: Error) => notice({ content: e.message, error: true }))
        .finally(() => {
          setSkin('')
          setLoading(false)
          pm.i++
        })
    } else {
      remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
        title: $('Change skin'),
        message: $('Please select the skin file.'),
        filters: [
          { name: $('Minecraft Skin File (.png)'), extensions: ['png'] }
        ]
      }).then(arg => {
        if (arg.canceled || !arg.filePaths[0]) {
          setSkin('')
          setLoading(false)
          pm.i++
          return
        }
        const img = new Image()
        img.onload = () => {
          const canvas = new OffscreenCanvas(0, 0)
          loadSkinToCanvas(canvas, img)
          try {
            ref3.current = isSlimSkin(canvas)
            setSkin(arg.filePaths[0])
          } catch (e) {
            console.error(e)
            notice({ content: $('Incorrect file format!'), error: true })
            setSkin('')
          }
          setLoading(false)
        }
        img.onerror = () => {
          notice({ content: $('Incorrect file format!'), error: true })
          setLoading(false)
        }
        img.src = arg.filePaths[0]
      })
    }
  }
  return <Dialog
    animation='zoom'
    maskAnimation='fade'
    className='profile'
    onClose={() => !loading && props.onClose()}
    visible={props.open}
    destroyOnClose
  >
    <div className='left'>
      <div id='skin-viewer' ref={ref} className='skin' />
      <div className='buttons' style={{ display: u && 'changeSkin' in l ? undefined : 'none' }}>
        <button className='btn btn-primary' disabled={loading} onClick={handleSkinChange}>
          {$(skin ? 'Upload!' : 'Change skin')}
        </button>
        <button className='btn btn-secondary' disabled={!skin || loading} onClick={() => setSkin('')}>
          {$('Cancel upload')}
        </button>
      </div>
    </div>
    <div className='right'>
      <div className='buttons'>
        <button
          className='btn btn-primary' disabled={loading} onClick={() => {
            props.onClose()
            pm.loginDialogVisible = true
          }}
        >{$('Add account')}</button>
        <button
          className='btn btn-secondary' disabled={loading} onClick={() => {
            autoNotices(Promise.resolve(pluginMaster.logins[u.type].logout(u.key))).finally(() => pm.i++)
          }}
        >{$('Log out')}</button>
      </div>
      <div className='text'>{$('Quick account switching:')}</div>
      <select value={u ? u.key : ''} onChange={e => pm.setSelectedProfile(e.target.value)}>
        {pluginMaster.getAllProfiles().map(it =>
          <option value={it.key} key={it.key}>{it.username} ({pluginMaster.logins[it.type][TITLE]()})</option>)}
      </select>
    </div>
  </Dialog>
}

export default Profile
