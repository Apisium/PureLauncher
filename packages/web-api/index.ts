import * as PureLauncherWebApi from './exports'
export * from './exports'

if (typeof window !== 'undefined') (window as any).PureLauncherWebApi = PureLauncherWebApi
if (typeof global !== 'undefined') (global as any).PureLauncherWebApi = PureLauncherWebApi
if (typeof self !== 'undefined') (self as any).PureLauncherWebApi = PureLauncherWebApi
