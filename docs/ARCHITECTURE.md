# Novel Mentions — Architecture

## Context

A companion app for readers: for a given novel (or autobiography/memoir), it catalogs the cultural references the author mentions — movies, songs, quotes, other books — with *where* they appear, *what* they are, *why* they were mentioned, and what the character/author was feeling at that moment. Users can write their own notes and log mentions they spot, which get fact-checked before being published to other readers.

Decisions so far:
- **Content**: mix of AI-assisted extraction (offline, human-reviewed before publishing) + community-contributed mentions (fact-checked before publishing).
- **User contributions**: written notes (private) + user-logged mentions (private until submitted and approved).
- **Platform**: mobile-first. **Stack: React Native + Expo** (decided July 2026, issue #1) — managed workflow, TypeScript, expo-router; stay Expo Go-compatible for all of Phase 1 (only bundled/pure-JS modules, installed via `npx expo install`). Rationale: Windows dev machine + iPhone 16 test device means no local iOS builds ever; Expo Go gives a live on-device iPhone loop with no Mac or Apple account, and one codebase ships to both App Store and Play Store via EAS Build/Submit from Windows (Flutter has no comparable iOS dev loop from Windows). If a custom native module becomes unavoidable (e.g. native cover-palette extraction), switch to an EAS cloud development build — that step, and TestFlight/App Store in Phase 3, is when the Apple Developer account ($99/yr) is needed. Architecture below remains stack-agnostic at the layer boundaries.
- **Scope**: Lean MVP first — local-first, no accounts/backend. Phase 2 adds backend + community.

## Domain model

Three core entities. Every entity has a string `id` (UUID) so local records can sync to a backend later without re-keying.

**Book**
- `id, title, author, workType (fiction | autobiography | memoir | nonFiction), synopsis, coverRef, palette, origin (seed | user)`
- `workType` drives presentation: the "context" field is labeled *"what the character was thinking"* for fiction vs *"what the author was thinking"* for autobiography/memoir.
- `palette`: per-book color identity (see Look & feel). Curated hexes for seed books; user-added books derive theirs from the cover image at add time (house fallback palette if there's no cover or derivation fails).
- `origin: user` books are created through the add-a-book flow (public books-API lookup → confirm → saved to the local DB). In MVP they are private to the reader; community publishing of user-added books is Phase 2.

**Mention** — the heart of the app
- Identity/what: `kind (movie | song | quote | book | place | other), title, attribution` (artist, director, original speaker; for places, e.g. "Place · Long Island, NY"). `place` is a real sixth kind (real locations a book anchors to, e.g. Gatsby's Valley of Ashes) — not a relabel of `other`.
- Where: `chapter` (primary locator), `positionHint` (optional), `page + edition` (optional). **Chapter is the canonical locator, not page** — page numbers differ across editions/printings, so page is stored only as an edition-qualified hint.
- Substance: `excerpt` (short quote, a sentence or two max — fair-use commentary territory, never long passages), `whyMentioned`, `characterContext`
- Provenance: `source (curated | ai | user)`, `contributorRef` (null for curated), `externalUrl?`
- Lifecycle: `status` — see state machine below.

**UserNote**
- `id, bookId, mentionId?` (null ⇒ note on the whole book), `body, createdAt, updatedAt`. Always private.
- `body` is **plain text** — no rich formatting (decided with the design handoff; the note sheet says "Private to you · plain text").
- The design handoff (Addendum A4) phrases this as "references either a `mentionId` or a `bookId`, never both" — same intent; we keep `bookId` always present + `mentionId` nullable since every note row displays its book context.

### Mention lifecycle (state machine)

```
personal ──submit──► pendingReview ──factcheck+approve──► published
   ▲                      │
   └──────── rejected ◄───┘   (rejection reason kept; user can revise & resubmit)
```

- Curated/AI seed content enters at `published` (already reviewed offline).
- In the **MVP**, everything left of `published` exists locally; "submit" just flips local status (the queue becomes real in Phase 2).
- Fact-check flow (Phase 2): AI pre-check (does this book plausibly contain this mention? is the excerpt/location consistent?) produces a confidence report → human moderator (initially the app owner) approves/rejects.

## Application architecture

Layered so the stack choice only affects the outermost implementations:

```
┌─────────────────────────────────────────────┐
│  UI (screens/widgets)                       │
├─────────────────────────────────────────────┤
│  State management (per-screen view state)   │
├─────────────────────────────────────────────┤
│  Repositories (the only API the UI sees)    │
│   BookRepository · MentionRepository        │
│   NoteRepository                            │
├──────────────┬──────────────┬───────────────┤
│ Seed source  │ Local DB     │ Remote API    │
│ (bundled     │ (user notes, │ (Phase 2 —    │
│  JSON assets)│  user        │  interface    │
│              │  mentions)   │  defined now, │
│              │              │  stubbed)     │
└──────────────┴──────────────┴───────────────┘
```

Key rules:
- **Repository pattern**: `MentionRepository.forBook(bookId)` merges published seed mentions with the user's local mentions; the UI never knows which store a mention came from beyond its `source`/`status` fields. Likewise `BookRepository` merges seed books with user-added books from the local DB (`Book.origin` tells them apart).
- **Book lookup is an interface** (`BookLookupSource`): the add-a-book flow searches a public books API through it (provider choice open — see Open decisions). Only metadata (title, author, year, cover) is fetched; the created record lives entirely in the local DB.
- **Local-first**: published content is always available offline (bundled in MVP; cached-on-sync in Phase 2). User notes/mentions are written locally first, synced later.
- **Remote API is an interface from day one** (`RemoteContentSource`), with a no-op stub in MVP. Phase 2 implements it against the chosen backend without touching UI or repositories.

## Content pipeline (out-of-app)

Two inflows converge on one review gate:

1. **AI extraction (owner-run, offline)**: script takes a book's plain text (public-domain or owner-supplied) → LLM pass extracts candidate mentions with location/excerpt/why → writes draft JSON → owner reviews/edits → committed as published seed content.
2. **Community submissions (Phase 2)**: in-app form → `pendingReview` on backend → AI fact-check report → moderator approve/reject → `published`, attributed to contributor.

The published-content format is the same JSON shape either way — one schema everywhere (bundled seed, extraction output, API payloads).

## Screens & UX (MVP)

**Navigation**: two bottom tabs — **Library** and **My stuff**. Stack navigation on top (Library → Book detail → Mention detail). "Log a mention" is a modal form.

1. **Library (home)** — search across **books & mentions**: results split into labelled "Books" and "Mentions" groups (mention rows show kind + "in {book}" and deep-link straight to Mention detail); a combined empty state offers "Add a book" plus a secondary "log a mention" line. Book cards with cover, title, author, workType, per-kind mention counts (a "No mentions yet" pill for books without any).
2. **Book detail** — header themed to the book's colors; filter chips (All + the kinds present, e.g. Songs / Movies / Quotes / Places / Books); mentions grouped under chapter/part headers in reading order (a chapter timeline); each row = kind icon + title/attribution + one-line why-preview; user's own mentions inline with a "Yours" badge; FAB "+" to log a mention. Header overflow (⋯) menu: "Add a note on this book" (+ "Share book" — pending decision). Existing book-level notes surface in a pinned, expandable card under the chips. A book with zero mentions (freshly user-added) shows a themed empty state ("No mentions yet … Log a mention") with the FAB present. Empty-user-content state: "Spotted a mention we missed? Log it."
3. **Mention detail** — top-down: kind badge → title + attribution → location row (chapter · edition-qualified page) → short excerpt styled as a quote → "Why it's here" → "What {character/author name} was thinking" (name from seed data; falls back to generic label) → "Your notes" list + add-note. For user-owned mentions: edit, delete, "Submit for review".
4. **Log/edit a mention (modal form)** — kind selector (segmented icon control, 6 kinds in one row), title, attribution, chapter, optional page+edition, short excerpt, why-mentioned, context. Saves as `personal`. Rejected mentions reopen this form pre-filled with the reviewer's reason pinned on top and a "Resubmit" action.
5. **My stuff** — tabs "My mentions" / "My notes"; rows show book + status badge: Personal (neutral), Pending review (warning), Published (success), Rejected (danger, with reason line). A whole-book note's context line reads "A note on the book · {book}" instead of naming a mention.
6. **Add a book (full-height bottom sheet)** — entered from the Library search empty state: search a public book database → results list (cover, title, author/year, per-row "Add") → confirm step ("Add to my library"; caption clarifies it's saved locally only). Includes loading-skeleton and no-results states.

UX details: note editor is a bottom sheet; notes attach to a mention or the whole book; empty states are invitations, not apologies. In MVP edit/delete is always available on own content; delete-after-publish policy is deferred to Phase 2.

### Look & feel — vibrant, book-driven color

- **Per-book color identity**: each book has a palette (primary + on-color tints, light and dark variants) that themes its screens — book detail header, active filter chips, FAB. Stored in seed JSON as curated hex values (`Book.palette`). User-added books derive the primary from the cover image at add time (dominant vibrant color, contrast-guarded so on-header text stays white/AA); if that fails, a house fallback palette applies (primary `#4A4038` light / `#C8BCAC` dark). Example identities: Gatsby = green (the dock light), Perks = mixtape pink.
- **Fixed kind colors app-wide**: songs = teal, movies = coral, quotes = amber, books = purple, places = blue, other = gray.
- **Flat and readable**: colorful tints/solids; every color pair has light- and dark-mode variants with proper contrast. Status colors stay semantic (pending = warning, published = success, rejected = danger).

**Design handoff (delivered 2026-07-10)**: [docs/design_handoff_novel_mentions/](design_handoff_novel_mentions/README.md). The README is the authoritative spec — its **Addenda section supersedes the body text** where they conflict (Place kind, add-a-book, search, book-level notes, FAB inset 24, one gradient per book). `Novel Mentions.dc.html` is a visual reference only; never port its HTML/SVG/CSS. Implementation must not hard-code visuals — build screens against a theme/token layer (book palette, kind colors, status colors, neutrals, type scale, spacing/radius) fed by the README's token values.

## Seed content (MVP)

Two curated books (~8–12 mentions each), short excerpts + original commentary only:
- **The Great Gatsby** (public domain) — jazz-age songs, real places/figures.
- **The Perks of Being a Wallflower** — dense with song/book/movie mentions; good test of the character-feeling field.

## Phasing

- **Phase 1 (MVP)**: everything above, local-only, no accounts (add-a-book fetches metadata from a public books API but saves locally). Ship to own phone.
- **Phase 2**: backend (candidate: Supabase), accounts, real submission→moderation pipeline with AI fact-check, content sync, contributor attribution.
- **Phase 3**: media integrations (Spotify/TMDB), more books via the extraction pipeline, discovery/search, App Store release.

## Open decisions

1. ~~**Stack**~~ — decided: React Native + Expo (see "Decisions so far" above; discussion on issue #1).
2. **Backend** (Phase 2): Supabase vs Firebase vs custom.
3. **Moderation model** (Phase 2): owner-as-moderator with AI assist vs heavier automation.
4. **Books-lookup API** for add-a-book: Open Library vs Google Books vs other (needs cover images + no-auth or free-tier access).
5. **"Share book"** overflow action (appeared in design Addendum A4): keep in MVP or drop.

## Verification (once building starts)

Static analysis + unit tests for repositories (seed loading, merge logic, note CRUD, lifecycle transitions) + widget/component tests for the main screens; manual run-through on a real device/emulator: browse → filter → mention detail → add note → log mention → submit → restart app → data persists.
