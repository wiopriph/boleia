# boleia-web

Web client of Boleia: intercity carpooling in Angola. Nuxt 4, Nuxt UI, Supabase.

```bash
npm install
cp .env.example .env   # SUPABASE_URL and SUPABASE_KEY (anon) of the dev project
npm run dev            # http://localhost:3000
```

Test users and the API contract: `../boleia-db/docs/api.md`. Types are synced from there with
`npm run sync-types`.

Deploy: Cloudflare Workers. `npm run build`, then `npm run cf:deploy` (`wrangler login` once).
Worker variables: `SUPABASE_URL`, `SUPABASE_KEY`, `NUXT_PUBLIC_SITE_URL` (public origin) and the secret
`NUXT_APP_SECRET` (OG image URL signing); `NUXT_PUBLIC_SUPPORT_EMAIL` is shown on `/contactos`.
Static texts (`content/`) are served by `@nuxt/content` from the D1 binding `DB`; wrangler creates the
database `boleia-content` on the first deploy.
