const cn = require('../../langs/zh-cn.json')
const fs = require('fs-extra')
const c = require('chalk')
const glob = require('globby')
const ts = require('typescript')
const { join, basename } = require('path')

module.exports = async (cmd, langName = '') => {
  if (cmd === 'check') {
    const files = await glob(langName)
    const lang = { }
    const visit = (node, root) => {
      if (ts.isCallExpression(node)) {
        const caller = node.expression
        if (ts.isIdentifier(caller) && caller.text === '$' && node.arguments.length) {
          const visitKey = expr => {
            if (ts.isStringLiteral(expr)) lang[expr.text] = root
            else if (ts.isConditionalExpression(expr)) {
              visitKey(expr.whenTrue)
              visitKey(expr.whenFalse)
            } else {
              console.error('❌  ' + c.redBright('Unknown expression type: ') +
                c.bgYellowBright.black(' ' + expr.kind + ' '))
              process.exit(-1)
            }
          }
          visitKey(node.arguments[0])
        }
      }
      node.forEachChild(n => visit(n, root))
    }
    ;(await Promise.all(files.map(name => fs.readFile(name)))).forEach((it, i) => {
      visit(ts.createSourceFile(files[i], it.toString(), ts.ScriptTarget.Latest), files[i])
    })

    lang.$LanguageName$ = lang.$readmeEn = ''
    const missing = Object.keys(lang).filter(it => !(it in cn))
    const redundant = Object.keys(cn).filter(it => !(it in lang))

    if (missing.length) {
      const symbol = c.redBright('-')
      console.log('⚠️  ' + c.yellowBright(`Missing entries detected: (${missing.length})`))
      console.log(missing.map(it => `   ${symbol} ${it} : ${c.gray(lang[it])}`).join('\n'), '\n')
    } else console.log('✔  ' + c.greenBright('No missing entry!'))

    if (redundant.length) {
      const symbol = c.greenBright('+')
      console.log('⚠️  ' + c.yellowBright(`Redundant entries detected: (${redundant.length})`))
      console.log(redundant.map(it => '   ' + symbol + ' ' + it).join('\n'), '\n')
    } else console.log('✔  ' + c.greenBright('No redundant entry!'))

    if (redundant.length + missing.length) {
      console.error('❌  ' + c.redBright('Failed to pass the linting.'))
      process.exit(-1)
    }
  } else {
    const commands = ['lint', 'sync']

    langName = basename(langName, '.json')
    if (langName === 'zh-cn') return
    if (!commands.includes(cmd) || !langName) {
      console.error('❌  ' + c.redBright('Unknown command ' + c.bgYellowBright.black(' ' + cmd + ' ') + ', please ' +
        c.bgGreenBright.black(' https://github.com/Apisium/PureLauncher/wiki/Tools_Language ') +
        ' To get more information.'))
      process.exit(-1)
    }
    const langFile = join(__dirname, '../../lang', langName + '.json')

    let lang
    try { lang = await fs.readJson(langFile) } catch (e) {
      console.error(e)
      console.error('❌  ' + c.redBright('Unable to read language file: ' + c.bgYellowBright.black(` ${langName}.json `)))
      process.exit(-1)
    }

    delete cn.$readmeEn
    const missing = Object.keys(cn).filter(it => !(it in lang))
    const redundant = Object.keys(lang).filter(it => !(it in cn))

    if (missing.length) {
      const symbol = c.redBright('-')
      console.log('⚠️  ' + c.yellowBright(`Missing entries detected: (${missing.length})`))
      console.log(missing.map(it => '   ' + symbol + ' ' + it).join('\n'), '\n')
    } else console.log('✔  ' + c.greenBright('No missing entry!'))

    if (redundant.length) {
      const symbol = c.greenBright('+')
      console.log('⚠️  ' + c.yellowBright(`Redundant entries detected: (${redundant.length})`))
      console.log(redundant.map(it => '   ' + symbol + ' ' + it).join('\n'), '\n')
    } else console.log('✔  ' + c.greenBright('No redundant entry!'))

    switch (cmd) {
      case 'lint': {
        const empty = Object.entries(lang).filter(it => !it[1]).map(it => it[0])
        if (empty.length) {
          const symbol = c.yellowBright('!')
          console.log('⚠️  ' + c.yellowBright(`Empty entries detected: (${empty.length})`))
          console.log(empty.map(it => '   ' + symbol + ' ' + it).join('\n'), '\n')
        } else console.log('✔  ' + c.greenBright('No empty entry!'))
        if (empty.length + redundant.length + missing.length) {
          console.error('❌  ' + c.redBright('Failed to pass the linting.'))
          process.exit(-1)
        }
        break
      }
      case 'sync': {
        if (missing.length + redundant.length) {
          missing.forEach(it => (lang[it] = ''))
          redundant.forEach(it => delete lang[it])
          try {
            await fs.writeFile(langFile, JSON.stringify(lang, null, 2) + '\n')
            console.log('✔  ' + c.greenBright('Save file successfully!'))
          } catch (e) {
            console.error(e)
            console.error('❌  ' + c.redBright('Cannot save file: ' + c.bgYellowBright.black(` ${langName}.json `)))
            process.exit(-1)
          }
        } else console.log('✔  ' + c.greenBright('No need to synchronize!'))
      }
    }
  }
}
