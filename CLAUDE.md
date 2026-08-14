# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state — read before doing anything

**Phase 1 is complete** — every feature built, device-verified, and merged (August 2026). In place: the scaffold (#3 — Expo SDK 54 managed + TypeScript + expo-router, rooted in `src/`, theme/token layer, two-tab shell), the domain models + seed JSON schema (#4), seed content for the two MVP books (#20), the repository + local-persistence layer (#22), the core screens — Library + Book detail (#7), Mention detail + notes (#8), the log-a-mention sheet + My stuff screen (#9) — plus add-a-book (#12), the `place` kind (#13), library search (#14), book removal (#34), logging a mention from My stuff (#27/#39), and book-level notes (#15).

Phase 1 gained late scope in August 2026, now also shipped: provenance-grouped Library shelves so the curated books don't read as the reader's own (#46), and first-run onboarding — a welcome pager, one-time coach-marks, and the Library `⋯` menu (#44 design → #45 build).

**Next up is Phase 2** (backend, accounts, the real submission → fact-check pipeline). Nothing is in progress. **GitHub issues are the live tracker** — check open issues before starting, and keep this paragraph roughly current as they close.

> **The seed books stay** (owner decision, August 2026). Removing them was considered so a new reader starts empty; rejected because Phase 1 has no backend, so without them the only path to content is *add a book → zero curated mentions → type your own by hand*, which hides the app's whole proposition. The seed content is product, not test scaffolding (see ARCHITECTURE.md → "Seed content (MVP)"). The confusion they cause is a **framing** problem, addressed by #46 and #44.

> **SDK 54, not latest**: the project targets Expo SDK 54 because that's what the released Expo Go supports on the test iPhone. Do not bump the SDK (via `create-expo-app` upgrades or `expo install --fix` to a newer major) unless Expo Go on the device supports it — a newer SDK makes the app unloadable in Expo Go, which is still the dev loop.

**Stack is decided** (issue #1, July 2026): **React Native + Expo** — managed workflow, TypeScript, expo-router. Hard constraint driving it: development happens on a Windows machine with an iPhone 16 as the test device (no local iOS builds; Expo Go is the dev loop). Through Phase 1 this meant: only Expo-bundled or pure-JS modules, added via `npx expo install`, and no libraries requiring custom native code.

> **Open decision — does the Expo Go constraint carry into Phase 2?** It was scoped to Phase 1, which closed in August 2026. Nothing has been decided since, so **keep treating it as live**: if a Phase 2 dependency needs custom native code, flag it and get an explicit decision rather than quietly switching the project to EAS development builds.

> **No distribution setup exists.** Expo Go is the only way the app currently reaches a device, and Expo Go is a dev loop, not distribution — sharing a build with anyone else needs EAS Build (an APK is the low-friction route on Android; iOS needs TestFlight). There is no `eas.json`, no `eas-cli` dependency, and no linked EAS project. The roadmap puts store release in Phase 3.

**Visual design is delivered** in two bundles, both authoritative:
- [docs/design_handoff_novel_mentions/](docs/design_handoff_novel_mentions/README.md) (issue #2) — the base system: the token layer plus the five main screens. Its Addenda section supersedes the body text where they conflict.
- [docs/design_handoff_onboarding_flow/](docs/design_handoff_onboarding_flow/README.md) (issue #44) — first-run onboarding (O1–O4), extending the base system. Adds exactly one colour token (`menuScrim`); read the base README for anything it doesn't redefine.

The `.dc.html` files in each are visual references only; never port their HTML/SVG/CSS. Do not hard-code visuals; all screens must be built against the theme/token layer holding the READMEs' token values.

The **base** handoff README and [docs/DESIGN_BRIEF.md](docs/DESIGN_BRIEF.md) predate the stack decision — ignore their "stack is undecided" language. (The onboarding bundle postdates it and targets this stack directly.) The brief was the *input* to the first design session and is historical; where it disagrees with a handoff, the handoff wins.

[README.md](README.md) is the repo's public front door — status, the feature set, run instructions, and a documentation index. It's written for a human arriving at the repo, so keep it in sync when shipping user-visible features; this file is the working context for a session and goes into more depth.

## Development

Requires **Node ≥ 20.19.4** (`.nvmrc` pins 24; enforced via `package.json` engines). Install deps with `npm install`. Add new libraries with `npx expo install <pkg>` (never bare `npm install <pkg>`) so versions stay SDK-compatible — and keep them Expo Go-compatible per the open decision above.

Commands:
- `npm start` — start the Expo dev server (scan the QR with Expo Go on the iPhone; the dev loop).
- `npm run ios` / `npm run android` / `npm run web` — start targeting a platform.
- `npm run typecheck` — `tsc --noEmit`.
- `npm run lint` — `expo lint` (ESLint flat config, `eslint-config-expo`).
- `npm test` — run the Jest suite (`jest-expo` preset).

Tests live in `__tests__/` folders beside the code they cover (`*.test.ts(x)`) and lean on pure logic + in-memory test doubles (an `InMemoryLocalStore`, deterministic `RepoDeps`) — nothing touches AsyncStorage or the device. Domain, repositories, and UI helpers are covered; screens are not (no React renderer wired into the suite yet).

### Project structure
- `src/app/` — expo-router routes. `(tabs)/` holds the tab roots (`index` = Library, `my-stuff` = My stuff); `book/[id]` and `mention/[id]` are pushed detail screens (sibling stack routes, so the tab bar hides on push). `_layout.tsx` loads fonts and wires the theme, then hands the splash off to `FirstRunGate`, which holds it until it knows whether the launch opens in onboarding.
- `src/theme/` — the token layer. `tokens.ts` holds the handoff values (mode-dependent ones as `{light,dark}`); `resolveTheme`/`resolveBookPalette` flatten them for the active scheme; consume via `useTheme()` / `useBookPalette()`. **Never hard-code hexes, sizes, or fonts in screens — pull from the theme.**
- `src/domain/` — Zod-validated models (`Book` / `Mention` / `UserNote`), enums, the mention lifecycle state machine (`lifecycle.ts`), per-book palette derivation, and seed-shape parse/serialize. Pure — no React, no I/O.
- `src/data/` — the data sources behind the repositories: `seed/` (bundled JSON + `SeedSource`), `local/` (a `LocalStore` interface with AsyncStorage and in-memory implementations — user collections plus the onboarding flags), `lookup/` (`BookLookupSource`, backed by Open Library for add-a-book), `remote/` (the no-op `RemoteContentSource` stub for Phase 2).
- `src/repositories/` — **the only layer the UI talks to**; merges seed + local per the architecture. `books` / `mentions` / `notes` cover content; `uiState` covers the one-shot onboarding cues. `create.ts` / `context.tsx` wire them; screens consume via `useRepositories()`. New user-data reads/writes go here, not in screens.
- `src/components/` — shared UI. Covers and chrome (`BookCover`, `Chips`, `SectionBand`); bottom sheets (`MentionSheet` for log/edit, `NoteSheet`, `AddBookSheet`, `BookPickerSheet`, `AboutSheet`); onboarding (`FirstRunGate`, `WelcomePager`, `CoachMark`).
- `src/ui/` — pure presentation helpers: kind icons/labels (`kind.ts`), status badge copy (`status.ts`), note meta line (`note.ts`), library `search.ts`, and list `derive` helpers (kind counts, chapter grouping, Library provenance sections). No theme/hooks, so they're unit-testable.
- `src/hooks/` — small shared hooks (`use-color-scheme`, `use-async`, `use-starter-shelf`).
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
