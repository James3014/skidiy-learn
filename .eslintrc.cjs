module.exports = {
  root: true,
  env: {
    node: true,
    es2021: true
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  ignorePatterns: ['node_modules', 'dist', 'coverage', '.husky', 'apps/**', 'packages/**', 'in/**', 'stable/**'],
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: null
      },
      plugins: ['@typescript-eslint'],
      extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
      rules: {
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
      }
    },
    {
      files: ['*.js', '*.cjs', '*.mjs'],
      extends: ['eslint:recommended', 'prettier']
    }
  ]
};
