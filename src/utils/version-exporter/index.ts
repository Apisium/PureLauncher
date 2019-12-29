import compile from 'lodash/template'
import { ResourceVersion } from '../../protocol/types'

const template = compile(require('./index.ejs'))

export default (v: ResourceVersion) => template({ v })
