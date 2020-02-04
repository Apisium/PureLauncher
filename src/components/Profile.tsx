import './profile.less'
import React, { useRef, useEffect, useState } from 'react'
import { join } from 'path'
import { useStore } from 'reqwq'
import { TITLE, SkinChangeable } from '../plugin/Authenticator'
import { cacheSkin } from '../utils/index'
import { promises as fs } from 'fs'
import { remote } from 'electron'
import { isSlimSkin, loadSkinToCanvas } from 'skinview-utils'
import { SkinViewer, createOrbitControls, WalkingAnimation, RotatingAnimation } from 'skinview3d'
import Dialog from 'rc-dialog'
import ProfilesStore from '../models/ProfilesStore'
import { SKINS_PATH } from '../constants'

const skinUrl = require('../assets/images/steve.png')

const Profile: React.FC<{ open: boolean, onClose: () => void }> = props => {
  const ref = useRef<HTMLDivElement>()
  const ref2 = useRef<SkinViewer>()
  const ref3 = useRef<boolean>(false)
  const pm = useStore(ProfilesStore)
  const u = pm.getCurrentProfile()
  const [skin, setSkin] = useState('')
  useEffect(() => {
    if (!ref.current) return
    const skinViewer = new SkinViewer({
      domElement: ref.current,
      width: 200,
      height: 260,
      skinUrl
    })
    createOrbitControls(skinViewer).enableRotate = true
    skinViewer.animations.add(WalkingAnimation)
    skinViewer.animations.add(RotatingAnimation)
    ref2.current = skinViewer
    return () => skinViewer.dispose()
  }, [ref.current])
  useEffect(() => {
    if (ref2.current) ref2.current.renderPaused = !props.open
  }, [props.open])
  useEffect(() => {
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
    forceRender
  >
    <div className='left'>
      <div ref={ref} className='skin' />
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
            pm.setLoginDialogVisible(true)
          }}
        >{$('Add account')}</button>
        <button
          className='btn btn-secondary' disabled={loading} onClick={() => {
            Promise.resolve(pluginMaster.logins[u.type].logout(u.key))
              .then(() => notice({ content: $('Success!') }))
              .catch(e => {
                console.error(e)
                notice({ content: $('Failed!'), error: true })
              })
              .finally(() => pm.i++)
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
