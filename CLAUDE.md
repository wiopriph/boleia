# boleia-web

Web client of Boleia (intercity carpooling in Angola, pt-AO, Multicaixa Express payments). Nuxt 4 +
Nuxt UI 4 + @nuxtjs/supabase. The backend is the sibling repo `../boleia-db` (Supabase: Postgres, RLS,
RPC, Edge Functions); there is no API server, the client talks to Supabase directly.

## Read first

- `../boleia-db/docs/api.md`: the contract (RPC, views, jsonb shapes, error codes, realtime, functions).
- `../boleia-db/docs/spec.md`: the spec; sections 5, 7, 9, 11, 12 matter for the client.
- `types/database.ts` is a copy from boleia-db: `npm run sync-types`, never edit by hand.
- `types/rpc.ts`: hand-written shapes of jsonb arguments and results (api.md "Формы jsonb").

## Rules

- Writes only via `useRpc().rpc(...)`; `from().insert/update` only for own `profiles`, `devices`,
  `notifications.read_at`. Money and statuses come from RPC results and views, never computed here.
- Errors: RPC raise `BOLEIA_<CODE>`, functions return `{ code }`. `useBoleiaError` maps codes through
  `app/utils/errors.ts`, the only text dictionary. Database messages are never shown.
- Realtime: exactly three subscriptions (passenger bookings, driver bookings, open chat); the chat one
  lives only on the open chat screen. Everything else is a pull on screen open.
- Phone of the other party only via `reveal_contact`; "Ligar" is a `tel:` link.
- Images are compressed on the client before upload to Storage (`<uid>/<file>`, 5 MiB limit).
- Only pt-AO, texts live in components. Money as `8 000 Kz` (`formatKz`), time in Africa/Luanda
  (`app/utils/dates.ts`). Statuses and money always in words and digits, never color alone.
- Nuxt UI components only (Lucide icons), one accent color, mobile first, one primary action per screen.
- Secrets: only `SUPABASE_URL` and the anon key via `.env`, never committed.
- Missing field or RPC: stop and describe what boleia-db needs; no client-side workarounds.
- SSR data must be the value returned from `useAsyncData` (or live in `useState`): refs filled as a
  side effect inside the handler are empty after hydration.

## Workflow

Each screen: short description (data, RPC, states) -> approval -> code -> check in the browser against
the shared cloud project with the test users from api.md (OTP 123456) -> `npm run typecheck`,
`npm run lint` -> commit to `master`. Commit messages in English, short, spec section in the body.
Deploy target is Cloudflare Workers (`wrangler.jsonc`).

## Gotchas

- `h3` 1.x is a direct devDependency on purpose: npm otherwise hoists h3 2.x from eslint's config
  inspector, and `@nuxtjs/supabase` then imports the wrong major (`event.req.headers.get is not a function`).
- Port 3000 is taken by Docker (local Supabase); `npm run dev` moves to 3001.
- Composables that `await` (useAsyncData) lose the Nuxt instance afterwards: call head composables
  before the await with reactive getters, wrap the rest in `nuxtApp.runWithContext`.
- nuxt-og-image: templates live in `app/components/OgImage/<Name>.satori.vue` (the renderer suffix is
  required), pages call `defineOgImage('<Name>', props)`; in satori stack blocks with fixed margins,
  `justify-between` over the full height clips the bottom.
