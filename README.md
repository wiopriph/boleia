# boleia-web

Web client of Boleia: intercity carpooling in Angola. Nuxt 4, Nuxt UI, Supabase.

```bash
npm install
cp .env.example .env   # SUPABASE_URL and SUPABASE_KEY (anon) of the dev project
npm run dev            # http://localhost:3000
```

Test users and the API contract: `../boleia-db/docs/api.md`. Types are synced from there with
`npm run sync-types`.

Node 24 (`.node-version`); the lock file is written by npm 11 and `npm ci` from npm 10 rejects it.

Deploy: Cloudflare Workers. `npm run build`, then `npm run cf:deploy` (`wrangler login` once).
The build bakes `SUPABASE_URL` and `SUPABASE_KEY` (anon key) from `.env`. Public runtime values live in
`wrangler.jsonc` `vars`: `NUXT_PUBLIC_SITE_URL`, `NUXT_PUBLIC_SUPPORT_EMAIL` (shown on `/contactos`) and
`NUXT_PUBLIC_SITE_INDEXABLE` (`"false"` keeps robots closed; remove it at launch). The only secret is
`NUXT_APP_SECRET` (OG image URL signing): `openssl rand -base64 36 | npx wrangler secret put NUXT_APP_SECRET`.
Static texts (`content/`) are served by `@nuxt/content` from the D1 binding `DB`; wrangler created the
database `boleia-content` on the first deploy and finds it by name afterwards.
