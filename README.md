<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="src/assets/brand/logo-dark.png" />
    <img src="src/assets/brand/logo-light.png" alt="WaveMusic" width="200" />
  </picture>
</p>

<p align="center">
  Browse, search and preview the current iTunes Top Albums chart.<br />
  Next.js 15 · TypeScript · Redux Toolkit + RTK Query · styled-components
</p>

---

WaveMusic shows the albums from Apple's
[Top Albums RSS feed](https://itunes.apple.com/us/rss/topalbums/limit=100/json) as a searchable,
filterable grid, lets you save favorites, and plays 30-second track previews through a
persistent mini-player. The feed asks for 100 albums but usually returns fewer (69–72 while
this was built); the app renders whatever comes back.

See **[FEATURES.md](FEATURES.md)** for a feature-by-feature walkthrough and how AI was used
to build it.

## Contents

- [Quick start](#quick-start)
- [Scripts](#scripts)
- [Configuration](#configuration)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Testing](#testing)
- [Accessibility](#accessibility)
- [Deploying to Vercel](#deploying-to-vercel)
- [Status and roadmap](#status-and-roadmap)
- [AI-assisted development](#ai-assisted-development)

## Quick start

Requires Node.js 20.9+ (Node 22 recommended; see `.nvmrc`) and npm.

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. No API keys or environment variables are needed.

> Don't run `npm run build` while `npm run dev` is running in the same folder: Next.js 15 uses
> `.next/` for both, and a build overwrites the dev server's files (it then serves 500s or
> hydration errors until restarted).

## Scripts

| Script                  | What it does                                   |
| ----------------------- | ---------------------------------------------- |
| `npm run dev`           | Development server with Fast Refresh           |
| `npm run build`         | Production build                               |
| `npm start`             | Serve the production build                     |
| `npm test`              | Jest + React Testing Library (all unit/integration tests) |
| `npm run test:watch`    | Jest in watch mode                             |
| `npm run test:coverage` | Jest with a coverage report in `coverage/`     |
| `npm run typecheck`     | `tsc --noEmit` (strict mode)                   |
| `npm run lint`          | ESLint 9 (Next.js core-web-vitals + TypeScript rules) |

## Configuration

| Variable                | Required | Purpose |
| ----------------------- | -------- | ------- |
| `ITUNES_TOP_ALBUMS_URL` | No       | Overrides the feed URL, e.g. to point at a local fixture server for testing. Defaults to the Apple feed. |

See `.env.example`.

## Tech stack

| Concern        | Choice | Notes |
| -------------- | ------ | ----- |
| Framework      | Next.js 15 (App Router), React 19 | Server components for data fetching; client components for interactivity |
| Language       | TypeScript (strict, plus `noUncheckedIndexedAccess`) | |
| Styling        | styled-components 6 | SSR style registry; typed theme; light/dark palettes as CSS variables |
| State          | Redux Toolkit 2 | `filters`, `favorites`, `player` slices |
| Data fetching  | Server `fetch` + Next Data Cache (feed), RTK Query (iTunes Lookup) | |
| Validation     | zod 4 | Every external payload (feed, lookup, localStorage) is validated |
| Font           | Geist (self-hosted via `next/font/local`) | No network needed at build time |
| Testing        | Jest 30 + React Testing Library 16 | 283 tests across 31 suites |

## Architecture

```
                 ┌──────────────── server ────────────────┐
 iTunes RSS ───▶ │ fetchTopAlbums (server-only)           │
 (Top Albums)    │  • Next Data Cache, revalidate 1h      │
                 │  • 10s timeout, typed errors           │
                 │  • zod schema → mapper → Album[]       │
                 └──────────────┬─────────────────────────┘
                                │ props (plain JSON)
                 ┌──────────────▼──────── browser ─────────┐
                 │ Redux store (one per request / page load)│
                 │  filters ◀──▶ URL (?q=&genre=&sort=&favorites=1)
                 │  favorites ◀──▶ localStorage (+ other tabs)
                 │  player ──▶ AudioEngine (the only <audio>)
                 │  itunesApi (RTK Query) ◀── iTunes Lookup │
                 └──────────────────────────────────────────┘
```

**Chart data.** `src/lib/itunes/fetchTopAlbums.ts` runs only on the server. The response is
cached in Next's Data Cache for an hour, so Apple sees roughly one request per hour regardless
of traffic. The page renders per request (`connection()`) so builds never depend on Apple
being reachable. The feed is validated entry by entry: one malformed album is skipped and
logged instead of breaking the page. Only a response that isn't the feed at all throws, which
the route's error boundary turns into a retryable error state.

**Album details and tracks.** The album page server-renders the header from the chart when
the album is charting (fast first paint, page title). Tracks come from the iTunes Lookup API
through RTK Query, called directly from the browser (the API sends CORS headers). Results are
cached and shared: playing an album from its grid card and then opening it fetches once.

**Filters ↔ URL.** Filters are loaded from the URL during the first render, so a shared link is
already filtered in the server HTML. After that Redux leads and writes back with a debounced
`history.replaceState`: no server round trip, and the Back button isn't flooded with one entry
per keystroke. Outside URL changes (logo link, Back/Forward) flow back into the store.

**Favorites.** Stored as full album snapshots (so albums that leave the chart can still be
shown) in versioned, zod-validated `localStorage`. They load after hydration, and every
component that renders them waits until its own part of the page has hydrated. That avoids
hydration mismatches when React hydrates streamed sections at different times. Other tabs stay
in sync through the `storage` event.

**Playback.** Redux holds the desired state (queue, track, play/pause, seek). A single
`AudioEngine` in the root layout owns the app's only `<audio>` element and makes it match.
That guarantees two previews never play at once, and playback survives navigation. It also
handles autoplay blocks, interrupted `play()` calls, external pauses (media keys), and the OS
media controls (Media Session API).

**Theming.** Colors are CSS custom properties. A tiny inline script applies the saved theme
before first paint, so there's no flash of the wrong theme and the server never needs to know
the user's preference.

## Project structure

```
src/
├── app/                     # Routes (App Router)
│   ├── layout.tsx           # Root layout: providers, app shell, mini-player, audio engine
│   ├── page.tsx             # Home: Top Albums (server component)
│   ├── album/[id]/          # Album detail page, loading skeleton
│   ├── error.tsx            # Route error boundary (retry)
│   ├── not-found.tsx        # 404
│   └── icon.png, apple-icon.png
├── assets/brand/            # Logos (light/dark) and wave mark
├── components/              # Shared UI: app shell, album grid/cards, primitives
├── features/
│   ├── albumDetail/         # Album header, track list, backdrop, back link
│   ├── favorites/           # Slice, storage, hooks, favorite button
│   ├── filters/             # Slice, filtering/sorting, URL sync, filter bar
│   └── player/              # Slice, audio engine, mini-player, play buttons
├── lib/
│   ├── itunes/              # Feed + lookup schemas, mappers, server fetch, fixtures
│   ├── format.ts            # Locale/UTC-pinned formatting
│   └── useHydrated.ts
├── store/                   # Store factory, provider, typed hooks, RTK Query API
├── styles/                  # Theme, palettes, global styles, color scheme script
├── test/                    # Render helper, factories
└── types/                   # Domain types (Album, Track, ...)
```

## Testing

```bash
npm test
```

283 tests in 31 suites, all running in Jest (jsdom for components, node for pure logic):

- **Data layer:** feed and lookup schemas and mappers against real captured responses, fetch
  error handling, RTK Query endpoint (request shape, caching, error states).
- **State:** every slice, filtering/sorting rules, URL parse/serialize round-trips, favorites
  persistence and cross-tab sync.
- **Components and integration:** album browser with URL sync, favorites views, album page
  states, the player (engine with a stubbed `HTMLMediaElement`, plus a track list + mini-player
  + engine integration suite), app shell navigation and skip link.
- **Regression tests** for the bugs found along the way, each confirmed to fail without its fix
  (for example, favorites hydrating before a streamed section).

End-to-end tests (Playwright) are deferred; see [Status and roadmap](#status-and-roadmap).

## Accessibility

- Skip link to the main content; one labelled main navigation with `aria-current`.
- Semantic landmarks (`main`, `nav`, `search`, labelled regions), real lists, heading order.
- All controls are labelled; toggles use `aria-pressed`; the seek bar is a native range input
  with spoken values ("0:15 of 0:30"); track durations are read out in words.
- Live regions announce result counts and the track that's now playing.
- 44px touch targets; visible keyboard focus rings; `prefers-reduced-motion` and
  `prefers-reduced-transparency` respected.
- Text and accent colors meet WCAG AA contrast in both themes (lowest pair 5.1:1).

## Deploying to Vercel

The app deploys to Vercel as-is: no environment variables, secrets or build settings needed.

1. Push the repository to GitHub.
2. In Vercel, **Add New… → Project** and import the repository.
3. Keep the detected defaults: framework **Next.js**, build command `npm run build`, install
   command `npm ci` (or the default), output handled by Vercel.
4. Optionally set the Node.js version to **22.x** under *Settings → General* to match `.nvmrc`.
5. Deploy.

Notes:

- Album artwork comes from `*.mzstatic.com` and goes through Next's image optimization (already
  allowed in `next.config.ts`).
- The chart is cached for an hour in the Data Cache; redeploying or waiting refreshes it.
- Track previews stream straight from Apple's CDN in the visitor's browser.

## Status and roadmap

The project was built in a 10-step plan, one reviewed commit per step:

| Step | Scope | Status |
| ---- | ----- | ------ |
| 1 | Scaffold + Jest | Done |
| 2 | styled-components + theme | Done |
| 3 | Types, zod schema, mapper + tests | Done |
| 4 | Server fetch, grid, loading/error states | Done |
| 5 | Store, filters, URL sync + tests | Done |
| 6 | Favorites + tests | Done |
| 7 | RTK Query lookup + album page | Done |
| 8 | Preview player + tests | Done |
| 9 | Redesign, accessibility and responsive polish | Done |
| 10 | Branding, README, FEATURES.md, Vercel deploy | Done |

The original plan had 12 steps. Two were deferred so the core app, polish and deployment could
be finished properly first:

- **Playwright e2e + GitHub Actions CI:** user journeys (filter → share → reload, favorite →
  reload, play → navigate) across Chromium, Firefox and WebKit, against a fixture feed (the
  `ITUNES_TOP_ALBUMS_URL` override already exists for this), with lint, typecheck, unit and e2e
  tests in CI.
- **Dockerfile:** a multi-stage build using Next's `output: 'standalone'`.

Known limitations:

- Favorites are stored per browser/device (no accounts).
- Previews depend on Apple; some tracks have none (they're shown as unavailable and skipped).
- Browsers may block the first preview until the user interacts with the page; the player
  explains this instead of failing silently.

## AI-assisted development

**Tools:** Claude Code (Anthropic, Claude Opus 5.5), used as a pair programmer in the Claude
desktop app.

**How it was used:** I defined the requirements, stack and architecture, and broke the work
into a 10-step plan. For each step, the AI produced the boilerplate, the implementation against
my brief, and the tests, then explained every change. I reviewed each diff and committed every
step myself; the AI never committed. It was also used for code review and root-causing bugs,
for running the type checker, linter and tests after each change, for checking pages in a
browser at phone and desktop sizes, and for first drafts of this documentation, which I edited.

**Parts that needed significant manual work or customization:**

- **Architecture and planning:** the stack, which state lives on the server, in Redux, in the
  URL and in localStorage, the step plan, and re-scoping it from 12 steps to 10.
- **Hands-on testing that found real bugs** the automated checks missed, each then diagnosed
  and fixed: a hydration error on the Favorites button in development, an RTK Query
  "middleware not added" error after Fast Refresh, the Next.js dev badge covering a player
  control, and the album backdrop not spanning a 1080p widescreen monitor.
- **Design and branding:** the visual direction (a streaming-app reference I chose), iterating
  on the result, and the logos and tab icon.
- **Review:** every step's diff before committing, checking the behavior against the brief.

More detail, including where the AI got things wrong, is in
[FEATURES.md → AI usage](FEATURES.md#ai-usage).
