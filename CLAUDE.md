# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state — read before doing anything

The app **scaffold is in place** (issue #3): an Expo (SDK 57, managed) + TypeScript + expo-router project rooted in `src/`, with the theme/token layer and a two-tab navigation shell. Feature screens (issues #4–#15) build on top of it.

**Stack is decided** (issue #1, July 2026): **React Native + Expo** — managed workflow, TypeScript, expo-router. Hard constraint driving it: development happens on a Windows machine with an iPhone 16 as the test device (no local iOS builds; Expo Go is the dev loop). **Stay Expo Go-compatible for all of Phase 1**: only Expo-bundled or pure-JS modules, added via `npx expo install`; do not introduce libraries requiring custom native code without flagging that this forces a switch to EAS development builds.

**Visual design is delivered** (issue #2): [docs/design_handoff_novel_mentions/](docs/design_handoff_novel_mentions/README.md). The README is the authoritative spec — its Addenda section supersedes the body text where they conflict. `Novel Mentions.dc.html` is a visual reference only; never port its HTML/SVG/CSS. Do not hard-code visuals; all screens must be built against a theme/token layer holding the README's token values.

Both the handoff README and [docs/DESIGN_BRIEF.md](docs/DESIGN_BRIEF.md) predate the stack decision — ignore their "stack is undecided" language. The brief was the *input* to the design session and is historical; where it disagrees with the handoff, the handoff wins.

## Development

Requires **Node ≥ 20.19.4** (`.nvmrc` pins 24; enforced via `package.json` engines). Install deps with `npm install`. Add new libraries with `npx expo install <pkg>` (never bare `npm install <pkg>`) so versions stay SDK-compatible — and keep them Expo Go-compatible per the Phase 1 constraint above.

Commands:
- `npm start` — start the Expo dev server (scan the QR with Expo Go on the iPhone; the dev loop).
- `npm run ios` / `npm run android` / `npm run web` — start targeting a platform.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint` — `expo lint` (ESLint flat config, `eslint-config-expo`).

There is no test runner yet — add one (and its command here) when the first testable logic lands.

### Project structure
- `src/app/` — expo-router routes. `(tabs)/` holds the tab roots (`index` = Library, `my-stuff` = My stuff); `book/[id]` and `mention/[id]` are pushed detail screens (sibling stack routes, so the tab bar hides on push). `_layout.tsx` loads fonts, gates the splash, and wires the theme.
- `src/theme/` — the token layer. `tokens.ts` holds the handoff values (mode-dependent ones as `{light,dark}`); `resolveTheme`/`resolveBookPalette` flatten them for the active scheme; consume via `useTheme()` / `useBookPalette()`. **Never hard-code hexes, sizes, or fonts in screens — pull from the theme.**
- `src/hooks/` — small shared hooks (e.g. `use-color-scheme`).
- Path alias `@/*` → `src/*`.
- Fonts: Newsreader + Hanken Grotesk via `@expo-google-fonts/*`, imported by **per-weight subpath** (not the package root) so Metro bundles only the faces in use; likewise import icons as `@expo/vector-icons/Ionicons`, not from the package root.

## What the app is

A mobile companion app for readers: for a given novel or memoir, it catalogs the cultural references the author mentions (songs, movies, quotes, books, places) — where they appear, why they were mentioned, and what the character/author was thinking. Users keep private notes, log their own mentions (fact-checked before publication to others — Phase 2), and can add books to their library via a public books-API lookup (local-only in MVP).

Roadmap: **Phase 1 — MVP** (local-first, no accounts/backend, two seed books) → **Phase 2 — Community** (backend, accounts, real submission/fact-check pipeline, sync) → **Phase 3 — Integrations** (Spotify/TMDB links, more books via AI extraction, App Store release). Milestones on GitHub mirror these phases.

## Architecture

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) is the authoritative blueprint. The load-bearing decisions to preserve:

- **Domain**: `Book` / `Mention` / `UserNote`, UUID string ids everywhere so local records sync to a Phase-2 backend without re-keying.
- **Mention lifecycle** is a state machine: `personal → pendingReview → published/rejected` (rejected keeps a reason and can be revised/resubmitted). In the MVP the whole machine is local — "submit" only flips status; the real queue arrives with the Phase 2 backend.
- **Chapter is the canonical location for a mention, never page** — page numbers vary by edition and are stored only as an edition-qualified hint.
- **Layered app**: UI → state → repositories → three data sources (bundled seed JSON, local DB for user data, and a `RemoteContentSource` interface that is a no-op stub in MVP). The UI only talks to repositories; `MentionRepository` merges seed + local user mentions per book.
- **Local-first**: published content always readable offline; user writes go to the local DB first.
- **One JSON schema everywhere**: bundled seed assets, the AI extraction script's output, and future API payloads share the same mention/book shape.
- **Excerpts stay short** (a sentence or two) — fair-use commentary, never long passages of copyrighted text.
- **Color system**: per-book palettes theme book screens (curated hexes in seed JSON; user-added books derive theirs from the cover, with a house fallback); fixed kind colors app-wide (song teal, movie coral, quote amber, book purple, place blue, other gray); status colors semantic. Light and dark variants required for every pair. Exact values: the handoff README's token tables.

## Git workflow

[docs/WORKFLOW.md](docs/WORKFLOW.md) defines the process; the essentials:

- Never commit directly to `main` once app code exists — feature branches named `<type>/<issue-number>-<slug>` (e.g. `feat/7-library-book-detail`), squash-merged via PRs with `Closes #<n>`.
- **Claude develops, the owner merges** (owner decision, July 2026): branch, commit, push, and open the PR, then stop — never run `gh pr merge` or merge by any other route. The flow ends at "PR is open, ready for review."
- This rule is discipline-based by explicit owner decision (July 2026): branch protection isn't available (free plan, private repo) and the owner declined local git hooks — follow the rule, but don't suggest or add enforcement mechanisms.
- Conventional commits (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`).
- Every non-trivial change gets an issue first, labeled (`feature`, `bug`, `design`, `infra`, `content`, `documentation`) and assigned a phase milestone.
- Remote: private repo `satviksriv/novel-mentions`. The GitHub CLI is installed at `C:\Program Files\GitHub CLI\gh.exe` — if `gh` isn't on PATH in the current shell, invoke it by that full path.
