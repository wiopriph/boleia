# Boleia interface

The existing Nuxt 4.6 / Nuxt UI 4.12 / Tailwind 4 stack is retained. No packages,
API contracts, composables, database types, route files, auth or payment handlers
were replaced. The only script additions in existing components are the filter
panel's disclosure state and the account layout's route-based presentation.

## Theme

- `app/assets/css/main.css`: brand and neutral scales, semantic surface/text/border
  tokens, typography, focus, shared link surfaces and reduced-motion support.
- `app/app.config.ts`: semantic Nuxt UI colors and shared component slots, sizes,
  radii and states. Primary hover uses the darker brand token.
- `public/fonts/InterVariable.woff2`: local Latin Inter variable font, with the
  upstream SIL Open Font License alongside it. `font-display: swap`; no font CDN
  is required at build time or in the browser.
- Controls: 48–52px; primary CTA: 52px; button radius: 14px; card radius: 18px;
  container: 1200px. Status colors remain separate from the brand palette.

The theme follows the [Nuxt UI theme API](https://ui.nuxt.com/docs/getting-started/theme).

## Shared presentation

The existing AppHeader, AppFooter, SearchForm, SearchFilters, TripCard,
TripDetail, TripBookingBox, popular routes, payment explanation and reservation /
driver list cards were updated. New small components are AppLogo, AppAccountNav,
UiPageHeader, UiEmptyState and TripDriverSummary.

Account navigation links only to existing sections; there is no new dashboard,
settings route or placeholder content. Existing auth middleware still protects
all account screens. Onboarding keeps its focused presentation.

Global component styles apply to login, publishing, account, booking, payment,
profile, review, content and administration screens. Their data, validation,
state branches and actions are retained. Prices, ratings and verification come
from existing data; service fees remain calculated by the existing payment flow.

## Verification — 12 November 2026

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed for the existing Cloudflare module target.
- No test suite or `test` script exists in this repository.
- Browser: home, city selection, search navigation, empty results, popular route,
  populated results, time filtering and reset, mobile filter disclosure, trip
  details, anonymous booking redirect to login, login and legal content.
- Home, populated search, trip details and login checked at 320, 375, 430, 768,
  1024 and 1440px. No horizontal page overflow observed.
- Text contrast: primary on white 4.91:1; secondary text on the page background
  4.77:1; main text on white 14.80:1.

Authenticated account screens, SMS delivery, actual bookings, money movements,
file uploads and admin actions were not exercised end to end. Their templates
are covered by type checking and the production build, not a signed-in browser
session. No external transactions or messages were created.

Pre-existing dependency diagnostics remain: OG image font extraction expects
Nuxt Fonts 1.x but the installed dependency is 0.14 (it uses its bundled Inter),
ReSVG falls back to WASM, and ESLint reports deprecated stylistic plugins. These
are separate from the local interface font and do not prevent the checks passing.

## Photographic backgrounds

The home hero now uses a decorative road landscape with a contrast-preserving
white overlay. A 768px WebP is selected below 768px; the desktop version is
1536px. The hero is eager/high priority. Popular routes opt into image cards;
other route lists keep their compact presentation. Route photos use native lazy
loading, explicit dimensions and empty alternative text because the route names
already provide the useful link content. Cards are horizontal with thumbnails
on phones and use four columns on desktop.

Three landscapes were generated with the built-in image_gen tool and optimized
with Sharp into local WebP assets. These are decorative, AI-generated scenes
inspired by Angola, not documentary images of particular route endpoints. Exact
prompts and asset paths are recorded in `docs/image-assets.json`. All final files
live in `public/images`; there are no external image requests or new packages.
The mobile hero is about 57 KB and the three shared card images total about
143 KB. Checked again at 320, 375, 430, 768, 1024 and 1440px with no horizontal
page overflow; the responsive hero source switches at the intended breakpoint.
