# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state — read before doing anything

This repository is in the **planning/design phase and contains no app code yet**. One decision gates implementation (tracked as issue #1):

1. **Stack is undecided** — React Native + Expo vs Flutter. Hard constraint: development happens on a Windows machine with an iPhone 16 as the test device, so there is no local iOS build capability.

**Visual design is delivered** (issue #2): [docs/design_handoff_novel_mentions/](docs/design_handoff_novel_mentions/README.md). The README is the authoritative spec — its Addenda section supersedes the body text where they conflict. `Novel Mentions.dc.html` is a visual reference only; never port its HTML/SVG/CSS. Do not hard-code visuals; all screens must be built against a theme/token layer holding the README's token values.

Do not scaffold the app or add build tooling until issue #1 is decided. There are no build/lint/test commands yet — add them to this file when the stack lands.

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
- This rule is discipline-based by explicit owner decision (July 2026): branch protection isn't available (free plan, private repo) and the owner declined local git hooks — follow the rule, but don't suggest or add enforcement mechanisms.
- Conventional commits (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`).
- Every non-trivial change gets an issue first, labeled (`feature`, `bug`, `design`, `infra`, `content`, `documentation`) and assigned a phase milestone.
- Remote: private repo `satviksriv/novel-mentions`. The GitHub CLI is installed at `C:\Program Files\GitHub CLI\gh.exe` — if `gh` isn't on PATH in the current shell, invoke it by that full path.
