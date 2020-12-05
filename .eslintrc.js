module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/essential',
    '@vue/standard'
  ],
  parserOptions: {
    parser: 'babel-eslint',
    ecmaFeatures:{
      legacyDecorators: true
    }
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-multiple-empty-lines': [2, {"max": 2}],
    'space-before-blocks': 0,
    'key-spacing': 0,
    'object-curly-spacing': 0,
    'space-before-function-paren':0,
    'arrow-spacing':0,
    'comma-spacing':0,
    'semi':0,
    'quotes':0,
    'keyword-spacing':0,
    'no-irregular-whitespace':0
  }
}
