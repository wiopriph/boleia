import wiopriph from '@wiopriph/eslint-config';


export default [
  ...wiopriph,
  { ignores: ['types/database.ts'] },
  {
    // Supabase columns, RPC arguments and jsonb fields are snake_case
    rules: { camelcase: ['error', { properties: 'never', ignoreDestructuring: true, ignoreImports: true }] },
  },
];
