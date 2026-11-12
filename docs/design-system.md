# Boleia design system

Rules for every screen of the web client. The theme lives in `app/assets/css/main.css` (tokens,
shared classes) and `app/app.config.ts` (Nuxt UI component defaults); this file says how to use them.
When a screen needs something that is not here, add it here first.

## Page frame

Every page has the same width. One container (`--ui-container`, 1200px, Nuxt UI gutters) holds the
header, the page and the footer, so the page title starts under the logo and the content ends under
the header's right edge.

| Frame | Component | Used by |
| --- | --- | --- |
| Page | `UiPage` | every public page |
| Section with navigation | `UiSectionShell` + `UiPage` | `/conta/*`, `/publicar`, `/avaliar/*` (through `AppAccountNav` in the layout), `/admin/*` |
| Intro band | `<section class="page-intro"><UContainer class="py-6 sm:py-8">` | search form on `/pesquisa`, `/boleias/*` |
| Centered message | `UContainer` with `max-w-md` | `/entrar`, error and "not found" screens only |

- Never set `max-w-*` on a page container. A page is as wide as the container.
- `UiPage` adds the vertical rhythm (`py-8 sm:py-10`). Inside `UiSectionShell` it drops its own
  container, so the same page component works in both frames.
- The section navigation is a left column (14rem) on desktop and a dropdown on phones.

## Layouts inside a page

| Layout | How | When |
| --- | --- | --- |
| One column | content directly in `UiPage` | lists, dashboards, account screens |
| Content and side column | `UiSplit` (`minmax(0,1fr)` + 22rem, sticky side) | trip, route, city, help pages, public profile |
| Narrow content | `.measure-form` (36rem) or `.measure-text` (48rem) on the block | single-task forms, long text |

Narrow content keeps the page's left edge; it is never centered. The side column carries context
(price and booking, trust, related links), never the primary action of another screen. On phones it
follows the content; `isAsideFirstOnPhone` puts it first when it has to be read before the list.

## Type

Inter, local variable font. Six sizes, no others.

| Role | Class | Size |
| --- | --- | --- |
| Page title, one per page | `.page-title` (through `UiPageHeader`) | 28 / 32px |
| Section title on the page | `.section-title` | 22 / 24px |
| Card title | `.card-title` | 18px |
| Body | default | 16px |
| Secondary text, meta | `text-sm text-muted` | 14px |
| Group label, eyebrow | `.group-label`, `.eyebrow` | 12px, uppercase |

`.eyebrow` is brand-colored and sits above a title; `.group-label` is muted and names a group inside
a page (a day in a list, a block of a dashboard). Money and times use `tabular-nums`.

## Color

- `primary` (brand green) for the one primary action, links and active navigation.
- `neutral` (stone) for text, borders, secondary and ghost buttons.
- `success`, `warning`, `error`, `info` only for states, always with words next to them.
- Page background `bg-muted`, surfaces `bg-default`, quiet blocks `bg-elevated`.
- `accent` (amber) is decorative: the logo dot and illustration tiles. Not for states or actions.

## Shape and space

| Token | Value | Used for |
| --- | --- | --- |
| `rounded-card` | 18px | cards, panels, empty states, modals |
| `rounded-control` | 14px | buttons, inputs, alerts, tab lists |
| `rounded-chip` | 10px | parts inside a control |

No other radius is written by hand; avatars and round icon buttons use `rounded-full`.

Spacing steps: 12px between cards of a list (`space-y-3`), 16px between side-column blocks, 24px
between blocks of a page (`space-y-6`, `mt-6` under the page header), 32-40px page padding. Card
padding comes from the `UCard` defaults (20px, 24px from `sm`).

## Components

- Surfaces are `UCard`. A link that looks like a card uses `.surface-link`.
- Page header: `UiPageHeader` (title, description, action slot). A back link goes above it as a
  `UButton variant="link" color="neutral"` with `i-lucide-arrow-left`.
- Empty and "nothing found" states: `UiEmptyState` with an icon, a title and at most one action.
- One solid primary button per screen. Others are `soft`, `outline` or `ghost`; destructive actions
  are `color="error"` and always confirmed in a modal.
- Controls are 48px high (`size="lg"`/`xl` defaults in `app.config.ts`), so they are comfortable on
  phones without per-screen sizing. A one-row textarea and an icon-only button have the same height
  (the button is square), so a field with a button next to it lines up without local classes.
- Lists inside a card: `divide-y divide-default`, rows `py-3`.
- Icons: Lucide only, 16px in text, 20px in navigation, 24px in illustration tiles.

## Responsive

Mobile first. Breakpoints in use: `sm` (640px) for two-column details, `md` (768px) for the header
navigation, `lg` (1024px) for side columns and the section navigation. Every screen is checked at
375px and 1280px; no horizontal page scroll at 320px.

## Checklist for a new screen

1. Root is `UiPage` (or the intro band plus `UiPage`); no width classes on it.
2. `UiPageHeader` with one `h1`; sections use `.section-title`, cards `.card-title`.
3. Side context goes to `UiSplit`; a form gets `.measure-form`.
4. Radii and colors only from the tokens above.
5. Empty, loading (`USkeleton`) and error (`UAlert`) states exist.
6. Checked at 375px and 1280px.
