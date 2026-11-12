import wiopriph from '@wiopriph/eslint-config';


export default [
  ...wiopriph,
  // .wrangler holds the bundled Worker while wrangler dev runs
  { ignores: ['types/database.ts', '.wrangler/**'] },
  {
    // Supabase columns, RPC arguments and jsonb fields are snake_case
    rules: { camelcase: ['error', { properties: 'never', ignoreDestructuring: true, ignoreImports: true }] },
  },
];
