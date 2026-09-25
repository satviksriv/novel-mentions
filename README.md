# Novel Mentions

A mobile companion app for readers. For a given novel or memoir, it catalogs the
cultural references the author mentions — songs, movies, quotes, other books,
real places — with where they appear in the book, what they are, why they were
mentioned, and what the character (fiction) or the author (memoir/
autobiography) was thinking at that moment.

Readers keep private notes on books and mentions, log mentions they spotted
themselves, and can add books to their library via a public books-API lookup.
User-submitted mentions are fact-checked before being published to other
readers.

## Status

**Shelved (September 2026).** Development stopped after Phase 1 and the project
is not being continued. The app is complete and working as an MVP — every Phase
1 feature built, verified on device, and merged (August 2026) — and the repo is
kept as a finished reference.

It runs on iPhone through Expo Go: local-first, no accounts, no backend, and
fully usable offline. It was never distributed; EAS builds and TestFlight were
never set up.

The Phase 2 and Phase 3 plans below were not started. Their design is preserved
in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and the two Phase 2 issues
(#35, #47) are closed as not planned rather than deleted, in case the project
is ever picked up again.

## What it does

**Explore curated content.** Two books ship with the app — *The Great Gatsby*
and *The Perks of Being a Wallflower* — carrying 23 curated mentions between
them. Each mention records its chapter location, a short excerpt, why it's
there, and what the character or author was thinking. Mentions group by chapter
in reading order and filter by kind. Every book carries its own colour identity,
themed through its screens.

**Make it yours.** Private notes on any mention or on a whole book. Log mentions
you spot yourself and move them through the submission lifecycle. Add books via
Open Library search, and remove your own again — your notes and mentions for that
book cascade with it. Search across every book and mention. A "My stuff" tab
collects everything you've written, with review status.

**Understand it on arrival.** First launch opens a three-beat welcome, then
one-time coach-marks teach browsing and logging in place. The Library separates
"Included to get you started" from "Your library", so the curated books never
masquerade as ones you added.

Light and dark throughout, driven by the system colour scheme.

### Not in Phase 1

No accounts and no sync. Nothing you log reaches other readers yet — "Submit for
review" flips a local status; the real fact-check pipeline is Phase 2. Media
links (Spotify/TMDB), AI-extracted books beyond the seed two, and the App Store
release are Phase 3.

## Running it

Requires **Node ≥ 20.19.4** (`.nvmrc` pins 24) and the **Expo Go** app on an
iOS or Android device.

```bash
npm install
```

```bash
npm start
```

Scan the QR code with your device's camera to open the app in Expo Go. The
machine running the dev server and the phone must be on the same network; if
that isn't possible, use `npx expo start --tunnel`.

Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Jest suite (`jest-expo`) — 133 tests |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `expo lint` |
| `npm run ios` / `android` / `web` | Start targeting a platform |

Add dependencies with `npx expo install <pkg>` rather than bare `npm install`,
so versions stay compatible with the pinned Expo SDK.

## Roadmap

- ~~**Phase 1 — MVP**~~ ✅ **Complete.** Local-first mobile app, no
  accounts/backend. Two seed books, browse mentions, private notes, log your own
  mentions, add books (saved locally only), first-run onboarding.
- **Phase 2 — Community** *(not started — project shelved)*: backend, accounts, submission → fact-check →
  moderation pipeline, content sync.
- **Phase 3 — Integrations** *(not started — project shelved)*: media links (Spotify/TMDB), more books via the
  AI extraction pipeline, discovery, App Store release.

## Stack

**React Native + Expo** (SDK 54, managed workflow, TypeScript, expo-router).
Development happens on Windows with an iPhone as the primary test device, which
is what drove the choice: there are no local iOS builds, so Expo Go provides the
live on-device loop and EAS handles cloud builds for store releases later. Phase
1 stayed Expo Go-compatible throughout — only Expo-bundled or pure-JS modules,
no custom native code.

The app is layered UI → repositories → data sources, with the UI talking only to
repositories. Rationale and the full blueprint: the architecture doc below.

## Documentation

| Document | What's in it |
| --- | --- |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | The authoritative blueprint — domain models, layering, mention lifecycle, colour system, phasing |
| [docs/design_handoff_novel_mentions/](docs/design_handoff_novel_mentions/README.md) | Base design system: token layer and the five main screens |
| [docs/design_handoff_onboarding_flow/](docs/design_handoff_onboarding_flow/README.md) | First-run onboarding design, extending the base system |
| [docs/WORKFLOW.md](docs/WORKFLOW.md) | Git flow: feature branches, PRs, conventional commits, issues per feature |
| [docs/DESIGN_BRIEF.md](docs/DESIGN_BRIEF.md) | Historical — the input to the first design session, predating the stack decision |
| [CLAUDE.md](CLAUDE.md) | Working context for Claude Code sessions |

## Development workflow

See [docs/WORKFLOW.md](docs/WORKFLOW.md) — light Git flow: short-lived feature
branches off `main`, PRs with conventional commits, issues per feature,
milestones per phase. (Historical now that the project is shelved.)
