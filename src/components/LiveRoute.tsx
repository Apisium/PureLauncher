import React from 'react'
import CacheRoute, { CacheRouteProps } from 'react-router-cache-route'

const hide = { className: 'route route-hide' }
const show = { className: 'route route-show' }
const behavior = (h: boolean) => h ? hide : show
const LiveRoute: React.FC<CacheRouteProps> = p => React.createElement(CacheRoute, { ...p, behavior })
export default LiveRoute
