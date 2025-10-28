export default {
  '*.{js,cjs,mjs,ts,tsx}': [
    'pnpm exec eslint --max-warnings=0 --fix',
    'pnpm exec prettier --write'
  ],
  '*.{json,md,yml,yaml,css,scss,html}': ['pnpm exec prettier --write']
};
