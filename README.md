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

**Pre-implementation.** The architecture is settled
([docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)), the visual design is
delivered
([docs/design_handoff_novel_mentions/](docs/design_handoff_novel_mentions/README.md)),
and the stack is decided (issue #1); implementation starts with the app
scaffold (issue #3). No app code yet.

## Roadmap

- **Phase 1 — MVP**: local-first mobile app, no accounts/backend. Two seed
  books, browse mentions, private notes, log your own mentions, add books
  (saved locally only).
- **Phase 2 — Community**: backend, accounts, submission → fact-check →
  moderation pipeline, content sync.
- **Phase 3 — Integrations**: media links (Spotify/TMDB), more books via the
  AI extraction pipeline, discovery, App Store release.

## Stack

**React Native + Expo** (managed workflow, TypeScript, expo-router), staying
Expo Go-compatible throughout Phase 1. Development happens on Windows with an
iPhone as the primary test device — Expo Go provides the live on-device loop,
and EAS handles cloud iOS/Android builds for store releases later. Rationale:
"Decisions so far" in the architecture doc and the discussion on issue #1.

## Development workflow

See [docs/WORKFLOW.md](docs/WORKFLOW.md) — light Git flow: short-lived feature
branches off `main`, PRs with conventional commits, issues per feature,
milestones per phase.
