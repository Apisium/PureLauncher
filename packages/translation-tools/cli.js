#!/usr/bin/env node

const fn = require('./index')
const argv = require('minimist')(process.argv.slice(2))._

if (argv.length > 1) argv.slice(1).forEach(it => fn(argv[0], it))
else fn()
