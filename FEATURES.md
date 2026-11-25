# WaveMusic features

A walkthrough of what the app does and how each piece works, followed by how AI was used to
build it. For setup and architecture, see the [README](README.md).

**Try it live:** <https://wavemusic-abdev.vercel.app>

## Contents

- [Album grid](#album-grid)
- [Search, filter and sort](#search-filter-and-sort)
- [Favorites](#favorites)
- [Album page](#album-page)
- [Preview playback](#preview-playback)
- [Themes and design](#themes-and-design)
- [Accessibility and responsive design](#accessibility-and-responsive-design)
- [Resilience](#resilience)
- [AI usage](#ai-usage)

## Album grid

- Shows every album the iTunes Top Albums feed returns, in chart order, with rank, cover art,
  title, artist, year and genre.
- Server-rendered: the first HTML already contains the grid; a skeleton streams instantly while
  the feed loads.
- Cover art is served at the right size per screen through Next's image optimization; the first
  rows load eagerly for a fast first paint.
- Each card has a **play button** that fetches the album's previews and starts playing without
  leaving the grid, and a **favorite** toggle. Both appear on hover or keyboard focus and are
  always visible on touch screens.

## Search, filter and sort

- **Search** by title or artist. Case- and accent-insensitive ("beyonce" finds "Beyoncé"), and
  every word must match ("swift showgirl").
- **Genre chips** built from the genres in today's chart, with counts. Tap a selected chip again
  to clear it.
- **Sort** by chart position, title, artist, newest or oldest. Ties fall back to chart position;
  undated albums sort last.
- **Favorites only** view.
- **Everything lives in the URL** (`/?q=swift&genre=Pop&sort=newest&favorites=1`): links are
  shareable, already filtered in the server HTML, and Back/Forward work. Defaults are left out,
  so each combination has exactly one URL; broken or stale parameters are cleaned up instead of
  breaking the page.
- A live result count ("Showing 11 of 69 albums") and a "No albums match" state with a one-tap
  reset.
- The title, search, sort, chips and result count stay pinned while the album grid scrolls
  underneath; a divider appears only once the header is actually pinned.
- Sort uses a custom, fully keyboard-accessible dropdown (arrow keys, type-ahead, Escape).

## Favorites

- Heart any album from its card or its page; the count shows in the navigation.
- Saved in the browser (`localStorage`) with a versioned, validated format: corrupt or outdated
  data is ignored rather than crashing the app.
- Each favorite stores a snapshot of the album, so albums that drop out of the chart still
  appear, in a separate "No longer in the chart" section.
- Changes in one tab appear in your other open tabs.
- The favorites view never flashes "No favorites yet" while saved favorites are still loading.

## Album page

- Large cover with a soft, blurred backdrop taken from the artwork, title, artist (linked to
  Apple Music), genre, release date, price, song count and total length, and copyright.
- Track list with track numbers, durations, explicit badges, per-track artists on compilations
  and disc grouping on multi-disc albums.
- Works for any album id, not just charting ones: albums outside today's chart are built from
  the iTunes Lookup API.
- Clear states for loading, "Album not found", "No tracks available", and failures (with a
  retry button). A non-numeric id is a real 404.
- The back link returns to the grid with the same search and filters you had.

## Preview playback

- Play any track's 30-second preview, or the whole album with the big play button.
- **One preview at a time, guaranteed:** the app has a single audio element.
- A **mini-player** stays on screen across pages: artwork, title, a link back to the album,
  previous/play/next, a seekable progress line and elapsed time.
- Auto-advances through the album; "previous" restarts the track if you're more than 3 seconds
  in.
- Tracks without a preview are marked and skipped.
- Works with the keyboard's media keys and the operating system's media controls (lock screen,
  browser media hub).
- If the browser blocks playback until you interact, the player says so ("Press play to start
  the preview") instead of failing silently.

## Themes and design

- A dark-first design inspired by modern streaming apps: sidebar navigation on desktop, a
  pinned search bar, scrollable filter chips, borderless cover-art cards, a two-column album page
  and a full-width player bar. All with WaveMusic's own logo and colors.
- Light and dark themes. The app follows the system setting until you pick one, and remembers
  your choice with no flash of the wrong theme on load.
- Separate light and dark logos switch with the theme, plus a dedicated browser-tab and home
  screen icon.

## Accessibility and responsive design

- Keyboard: a "Skip to content" link, visible focus rings, and every control reachable and
  labelled.
- Screen readers: proper landmarks and headings, toggles that announce their state, a seek bar
  that reads "0:15 of 0:30", durations read as "4 minutes 16 seconds", and live announcements
  for result counts and the track that's now playing.
- Color contrast meets WCAG AA in both themes.
- Respects reduced-motion and reduced-transparency preferences.
- Layouts tested at phone (375px), desktop (1440px) and wide (1920px) sizes: a compact top bar
  and two-column grid on phones, the sidebar from 1024px, 44px touch targets throughout, and no
  horizontal scrolling.

## Resilience

- Every external payload is validated (feed, lookup, saved favorites); bad entries are skipped,
  not fatal.
- If the chart feed is down, the home page shows a retryable error and album pages still work
  from the Lookup API.
- The feed is cached for an hour, so Apple outages are often invisible to users.
- Builds don't depend on Apple being reachable.

## AI usage

### Tools

- **Claude Code** (Anthropic, Claude Opus 5.5), used in the Claude desktop app as a pair
  programmer: for code generation, test generation, code review, debugging support,
  in-browser verification and documentation drafts.

### How I worked with it

I owned the engineering decisions and used AI to speed up implementation under my direction.

- **Architecture and stack were my calls.** Before any code, I defined the stack (Next.js 15
  App Router, strict TypeScript, styled-components with an SSR registry, Redux Toolkit with
  RTK Query, zod, Jest + React Testing Library) and how responsibilities split: server-side
  fetching for the chart, RTK Query for per-album lookups, Redux slices for filters,
  favorites and the player, and a single global audio player.
- **I planned the work as small, reviewable steps**, one commit each, in a 10-step plan:
  scaffold and testing, theming, the data layer, the grid, filters with URL sync, favorites,
  the album page, preview playback, the redesign with accessibility polish, then
  documentation and deployment. I re-scoped it as the work went on, deferring Playwright/CI
  and Docker so the core app, polish and deployment were solid first.
- **The AI implemented each step against my brief**, then explained every change. I reviewed
  each diff, asked for changes where needed, and **committed every step myself**. The AI was
  not allowed to commit.
- **I tested the app by hand on my own setup** and drove the fixes for what I found.
- **I set the product and design direction:** the feature set, a modern streaming-app look
  (using a reference I chose), and the WaveMusic logos and icons, which I supplied.

### What AI was used for

| Area | How AI helped |
| ---- | ------------- |
| Boilerplate and setup | Scaffolding, configs (Next, Jest, ESLint, TypeScript) |
| Implementation | Components, slices, schemas and mappers written against my brief, then reviewed by me |
| Tests | Unit, integration and regression tests (297 in total), each regression test checked to fail without its fix |
| Code review and debugging | Investigating library behavior (Next caching, RTK Query internals), root-causing the bugs I reported |
| Verification | Running typecheck, lint and tests after every change; checking pages in a browser at phone and desktop sizes |
| Documentation | Drafts of the README and this file, edited by me |

### Parts that needed significant manual work or customization

- **Requirements, architecture and planning:** the stack, the state design (what lives in the
  server, Redux, the URL and localStorage), the step plan and the re-scoping.
- **Hands-on testing that found real bugs** the automated checks missed, each diagnosed and
  fixed with the AI:
  - a hydration error on the Favorites button in development (favorites loading before a
    streamed section hydrated);
  - an RTK Query "middleware not added" error after Fast Refresh (a stale store paired with a
    reloaded API module);
  - the Next.js dev badge covering the previous-track button;
  - the album backdrop not spanning a 1080p widescreen monitor.
- **Design:** choosing the visual direction and reference, iterating on the result, and
  creating the brand assets (logos for light and dark themes, and the tab icon).
- **Review and judgment:** reviewing each step's diff before committing, checking that the
  feed handling matched the brief (render whatever the feed returns), and keeping the
  scope realistic for the time available.

### Lessons

- AI was fastest on well-specified work with a tight feedback loop (types, tests, browser
  checks). Clear requirements and small steps made its output easy to review.
- The most valuable bugs came from using the app myself on real hardware and workflows: a
  different monitor, Fast Refresh, my own dev server. AI output still needs a human to test it
  for real.
- AI made mistakes too. It once ran builds that disrupted my running dev server, and its first
  diagnosis of the hydration error was wrong. Reviewing each step and checking root causes
  caught both.
