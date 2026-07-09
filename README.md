# Novel Mentions

A mobile companion app for readers. For a given novel or memoir, it catalogs the
cultural references the author mentions — songs, movies, quotes, other books —
with where they appear in the book, what they are, why they were mentioned, and
what the character (fiction) or the author (memoir/autobiography) was thinking
at that moment.

Readers keep private notes on books and mentions, and can log mentions they
spotted themselves. User-submitted mentions are fact-checked before being
published to other readers.

## Status

**Planning / design phase.** The architecture is settled
([docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)); visual design is being produced
separately and implementation starts when it lands. No app code yet.

## Roadmap

- **Phase 1 — MVP**: local-first mobile app, no accounts/backend. Two seed
  books, browse mentions, private notes, log your own mentions.
- **Phase 2 — Community**: backend, accounts, submission → fact-check →
  moderation pipeline, content sync.
- **Phase 3 — Integrations**: media links (Spotify/TMDB), more books via the
  AI extraction pipeline, discovery, App Store release.

## Stack

Mobile-first; final stack decision is parked between React Native + Expo and
Flutter (see "Open decisions" in the architecture doc). Development happens on
Windows with an iPhone as the primary test device.

## Development workflow

See [docs/WORKFLOW.md](docs/WORKFLOW.md) — light Git flow: short-lived feature
branches off `main`, PRs with conventional commits, issues per feature,
milestones per phase.
