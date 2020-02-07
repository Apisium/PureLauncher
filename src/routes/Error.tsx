import './error.css'
import React from 'react'
import history from '../utils/history'

const ErrorPage: React.FC = () => {
  return <div className='pl-empty error vh100'>
    <div className='container'>
      <i
        role='button'
        className='iconfont icon-minecraft'
        onClick={() => history.goBack()}
      />
      <p>{$('An unknown error occurred!\nPlease click the Creeper icon above to reload the page.')}</p>
    </div>
  </div>
}

export default ErrorPage
