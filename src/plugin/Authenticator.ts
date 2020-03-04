import React from 'react'

export const NAME = Symbol('Authenticator')
export const FIELDS = Symbol('Fields')
export const LINK = Symbol('Link')
export const TITLE = Symbol('Title')
export const LOGO = Symbol('Logo')
export const COMPONENT = Symbol('Component')
export interface Field {
  name: string
  title: () => string
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> & React.ClassAttributes<HTMLInputElement>
}
export const registerAuthenticator = (args: {
  name: string
  title: (authenticator: Authenticator, profile?: Profile) => string
  logo: string
  fields?: Field[]
  link?: { name: () => string, url: () => string }
  compoent?: React.ComponentType
}) => <T extends { new (...args: any[]): { } }> (C: T) => class RegisteredAuthenticator extends C {
  public [NAME] = args.name
  public [TITLE] = args.title
  public [FIELDS] = args.fields || []
  public [LINK] = args.link
  public [LOGO] = args.logo.replace(/\\/g, '/')
  public [COMPONENT] = args.compoent
}

export interface Profile {
  clientToken: string
  accessToken: string
  uuid: string
  username: string
  type: string
  displayName?: string
  skinUrl?: string
  key: string
}

export default abstract class Authenticator {
  public abstract async login (options: any): Promise<string>
  public abstract async logout (key: string): Promise<void>
  public abstract async refresh (key: string): Promise<void>
  public abstract async validate (key: string, autoRefresh: boolean): Promise<boolean>
  public abstract getData (key: string): Profile
  public abstract getAllProfiles (): Profile[]
}
export interface SkinChangeable {
  changeSkin (key: string, path: string, slim: boolean): Promise<void>
}
