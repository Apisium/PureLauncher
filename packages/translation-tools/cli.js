#!/usr/bin/env node

const fn = require('./index')
const argv = require('minimist')(process.argv.slice(2))._

if (argv.length > 1) {
  argv
    .slice(1)
    .filter(it => it !== 'zh-cn' && it !== 'zh-cn.json')
    .forEach(it => fn(argv[0], it))
} else fn()
