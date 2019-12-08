module.exports = () => ({
  visitor: {
    CallExpression (p) {
      const c = p.get('callee')
      if (c.isIdentifier() && c.node.name === '$') c.node.name = '__$pli0'
    }
  }
})
