import CacheRoute, { CacheRouteProps } from 'react-router-cache-route'
import React from 'react'
import ErrorHandler, { AUTO_RELOAD } from './ErrorHandler'

const hide = { className: 'route route-hide' }
const show = { className: 'route route-show' }
const behavior = (h: boolean) => h ? hide : show
const LiveRoute: React.FC<CacheRouteProps> = p => React.createElement(ErrorHandler, AUTO_RELOAD,
  React.createElement(CacheRoute, { ...p, behavior }))
export default LiveRoute
