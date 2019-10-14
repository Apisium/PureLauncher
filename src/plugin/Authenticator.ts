import React from 'react'

export const NAME = Symbol('Authenticator')
export const FIELDS = Symbol('Fields')
export const LINK = Symbol('Link')
export const TITLE = Symbol('Title')
export const IMAGE = Symbol('Image')
export interface Field {
  name: string
  title: () => string
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> & React.ClassAttributes<HTMLInputElement>
}
export const RegisterAuthenticator = (name: string, title: () => string, img: string, fields: Field[],
link?: { name: () => string, url: () => string }) =>
  <T extends { new (...args: any[]): { } }> (C: T) => class RegisteredAuthenticator extends C {
    public [NAME] = name
    public [TITLE] = title
    public [FIELDS] = fields
    public [LINK] = link
    public [IMAGE] = img
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
  public abstract async validate (key: string): Promise<boolean>
  public abstract getData (key: string): Profile
  public abstract getAllProfiles (): Profile[]
}
