# boleia-web

Web client of Boleia: intercity carpooling in Angola. Nuxt 4, Nuxt UI, Supabase.

```bash
npm install
cp .env.example .env   # SUPABASE_URL and SUPABASE_KEY (anon) of the dev project
npm run dev            # http://localhost:3000
```

Test users and the API contract: `../boleia-db/docs/api.md`. Types are synced from there with
`npm run sync-types`.

Deploy: Cloudflare Workers. `npm run build`, then `npm run cf:deploy` (`wrangler login` once;
`SUPABASE_URL` and `SUPABASE_KEY` as Worker variables).
