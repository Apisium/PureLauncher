import './list.less'
import prettyBytes from 'pretty-bytes'
import React, { Component } from 'react'
import { TaskStatus } from '../../utils/index'
import { downloader } from '../../plugin/DownloadProviders'

const css = { transform: 'unset' }
export default class Tasks extends Component {
  private shouldUpdate = false
  private bytes = 0
  private prevBytes = 0
  private timer = setInterval(() => {
    this.prevBytes = this.bytes
    this.bytes = downloader.bytes
    if (downloader.bytes && this.bytes === this.prevBytes) {
      downloader.bytes = this.prevBytes = this.bytes = 0
      this.forceUpdate()
    }
    if (!this.shouldUpdate) return
    this.forceUpdate()
    this.shouldUpdate = false
  }, 500)
  constructor (props: any, context: any) {
    super(props, context)
    window.__updateTasksView = () => { this.shouldUpdate = true }
  }
  public componentWillUnmount () {
    window.__updateTasksView = () => { }
    clearInterval(this.timer)
  }
  public render () {
    const cancel = $('Cancel')
    return <div className='manager-list version-switch manager-versions manager-tasks'>
      <div className='list-top'>
        <span className='header'>{$('Tasks')}</span>
        <span className='speed'>{$('Speed')}: {prettyBytes((this.bytes - this.prevBytes) * 2)}/s</span>
        <a
          role='button'
          className='add-btn'
        >
          <i data-sound className='iconfont icon-shanchu_o' />
          <span data-sound>{$('Clear')}</span>
        </a>
      </div>
      <ul>{__tasks.map(it => <li key={it.key} className={it.status} style={css}>
        <div className='text'>{it.name} {it.subName && <span>{it.subName}</span>}</div>
        {it.status === TaskStatus.PENDING && <progress value={it.progress} max={100} />}
        {it.status === TaskStatus.PENDING && <div className='button'>
          <button onClick={it.cancel} className='btn2 danger'>{cancel}</button>
        </div>}
      </li>)}</ul>
    </div>
  }
}
