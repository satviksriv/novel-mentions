# Handoff: Novel Mentions

## Overview
Novel Mentions is a **mobile companion app for readers**. For a given novel or memoir it catalogs the cultural references the author reaches for — songs, movies, quotes, and other books — recording where each appears, what it is, why it was mentioned, and what the character (fiction) or author (memoir) was thinking at that moment. Readers keep private notes and can log mentions they spotted themselves; user-submitted mentions are fact-checked before being published to other readers (that review phase is later, but its statuses appear in the UI now).

This bundle covers the 5 MVP screens plus component states, in **light and dark mode**, and the full design-token spec.

## About the Design Files
The file in this bundle (`Novel Mentions.dc.html`) is a **design reference created in HTML** — a prototype showing intended look and behavior. It is **not production code to copy directly**. The task is to **recreate these designs in the target codebase's environment**, using its established patterns and libraries.

The implementation stack is **undecided** — the leading candidates are **React Native + Expo** or **Flutter**. Pick whichever the team prefers (or the one already in use) and build with standard mobile navigation patterns: bottom tabs, native stack, and bottom sheets. Nothing exotic is required. All screens are designed against **iPhone 16 (≈393 × 852 pt)** as the primary reference device.

> The HTML uses CSS custom properties for theming and inline SVG for icons purely to make the prototype self-contained. In the real app, use the platform's theming system (e.g. a theme context / `useColorScheme`) and an icon library or vector assets — do not port the raw SVG paths.

## Fidelity
**High-fidelity (hifi).** Final colors, typography, spacing, and states are specified below with exact values. Recreate the UI faithfully using the codebase's component library. Book covers are **stylized placeholders** (a colored gradient tagged `cover.img`) — wire real cover images into those slots when available; the placeholder is the fallback.

---

## Navigation
- **Two bottom tabs:** `Library` and `My stuff`.
- **Stack on top of each tab:** Library → Book detail → Mention detail.
- **Modal:** "Log a mention" opens as a bottom-sheet form (also used for edit/resubmit).
- Bottom tab bar is visible on the **tab roots** (Library, My stuff) and **hidden** on pushed screens (Book detail, Mention detail) and modals.

---

## Screens / Views

### 1. Library (tab root)
- **Purpose:** Browse the reader's books; jump into any book.
- **Layout:** Vertical scroll. Screen title (serif) + subline, a search field, then a stack of book cards. 20px horizontal padding.
- **Components:**
  - **Screen title** "Library" — Newsreader 600, 30px, color `text`. Subline "2 books · 21 mentions catalogued" — Hanken 400, 13px, color `text-2`.
  - **Search field** — height 44, radius 14, bg `surface-2`, magnifier icon + placeholder "Search books & mentions" (color `text-3`, 15px).
  - **Book card** — flex row, gap 15, padding 14, bg `surface`, 1px `border`, radius 18, `shadow`. Contains:
    - **Cover** 76×108, radius 9, per-book gradient, thin dark spine line 3px inset 9px from left, title in Newsreader 600 13px white bottom-aligned, author uppercase 8.5px. Small `cover.img` tag top-right (remove in prod; it marks the swap slot).
    - **Title** Newsreader 600, 18.5px. **Author · genre** Hanken 12.5px, `text-2`.
    - **Count chips row** (flex, wrap, gap 6): one chip per kind that has mentions — kind icon + number, text color = kind color, bg = kind soft color, radius 8, 12px 700.
  - Sample data: *The Perks of Being a Wallflower* — Chbosky, Fiction (songs 5, movies 2, quotes 3, books 2). *The Great Gatsby* — Fitzgerald, Fiction (songs 2, quotes 4, books 1, other 3).

### 2. Book detail (pushed)
- **Purpose:** See all mentions in a book, in reading order, filterable by kind.
- **Layout:** A **themed header** (colored to the book's palette) pinned at top, then a scrolling body: filter chips → mentions grouped under chapter/part headers. Floating **+** FAB bottom-right (24px inset, 26px above home indicator).
- **Components:**
  - **Header** — bg = book `header-bg`, text/icons white. Back chevron, then a row: small cover 66×94 + title (Newsreader 600, 23px) + author (13px, 90% opacity) + a "12 mentions" pill (white @ 18% bg, radius 20, 12px 600).
  - **Filter chips** — horizontal row, gap 8. Inactive: bg `surface-2`, text `text-2`, 1px `border`. Active: bg book `chip-active`, white text, no border. Radius 20, padding 7×14, 13px 600. Chips: `All / Songs / Movies / Quotes / Books` (Gatsby uses `Places` instead of a 4th where real locations exist).
  - **Chapter header** — uppercase label (11px 700, +9% tracking, `text-3`) + a 1px `border` rule filling remaining width. e.g. "Part one", "Chapter 3".
  - **Mention row** — flex, gap 12, padding 13×2, 1px `line` bottom border. Left: **kind icon tile** 34×34, radius 10, bg kind-soft, kind-color glyph. Middle: title (15px 600), attribution (12.5px `text-2`, e.g. "The Smiths · 1985 · p. 27"), one-line "why" preview (12.5px `text-3`, 1.38 line-height, truncates). Right: chevron (`text-3`).
  - **Reader's own mentions** appear inline with a **"Yours" badge** next to the title (bg book `soft-tint`, text book `accent`, 10px 700 uppercase, radius 6).
  - **FAB** — 56×56, radius 19, bg book `fab`, white +, shadow tinted with the book color.

### 3. Mention detail (pushed)
- **Purpose:** Everything about one mention; the reader's private notes.
- **Layout:** Nav bar (back + book title in `text-2`), then a top-down scroll.
- **Reading order (top → bottom):**
  1. **Kind badge** — pill, kind-soft bg, kind-color text + icon, 11.5px 700 uppercase (e.g. "SONG").
  2. **Title** — Newsreader 600, 27px. **Attribution** — 14px `text-2` (e.g. "The Smiths · 1985").
  3. **Location** — pin icon + "Part one · p. 27" with edition "(2012 ed.)" in `text-3`. 12.5px.
  4. **Excerpt** — styled as a pull-quote: Newsreader italic 18.5px, 3px left border in the **kind color**, left padding 15.
  5. **"Why it's here"** — labeled block (label 11px 700 uppercase `text-3`; body 14px, 1.5).
  6. **"What {character} was thinking"** — same block style; the label uses the **actual character name** (fiction) or **author name** (memoir), e.g. "What Charlie was thinking".
  7. **"Your notes"** — a stack of note cards (bg `surface-2`, radius 13, body 13.5px, meta "You · Jan 4" in `text-3`) + an **Add a note** dashed affordance (1px dashed `border`, radius 12, + icon).
- **Owner variant** (mention the reader created): a **status badge** sits beside the kind badge (e.g. "Personal"), and an action group appears after the two context blocks:
  - **Submit for review** — full-width primary button, bg book `fab`, white, 700 13.5px, radius 13, up-arrow icon; caption below "We'll fact-check it, then publish for other readers." (11.5px `text-3`).
  - **Edit** (outline, `border` + `text`) and **Delete** (outline, `rejected` color) side by side, radius 12.

### 4. Log / edit a mention (bottom-sheet modal)
- **Purpose:** Create or edit a mention; also the resubmit surface for a rejected one.
- **Layout:** Dimmed scrim (`rgba(12,8,3,.5)`) over the underlying screen; sheet slides from bottom, radius 26 top corners, grab handle, header row (Cancel · title · Save).
- **Fields (in order):**
  - **Kind selector** — segmented control, 5 icon+label items (Song / Movie / Quote / Book / Other) in a `surface-2` track (radius 14, padding 5). Selected item: bg `surface`, `shadow`, icon+label in the **selected kind's color**.
  - **Title** (text), **Attribution** (text), **Chapter / part** (text), **Page** + **Edition** (two-up row), **Short excerpt** (textarea), **Why it's mentioned** (textarea), **Character context** (textarea).
  - Field style: label 11.5px 700 uppercase `text-2`; input min-height 44, 1px `border`, radius 12, bg `bg`, 14.5px; placeholder text in `text-3`.
- **Rejected → resubmit variant:** header Save button becomes **Resubmit** (bg `rejected`). A **reviewer's-reason banner** is pinned at the very top: bg `rejected` soft, 3px left border `rejected`, label "REVIEWER'S REASON" with a (!) icon, then the reason text. The field the reviewer flagged (e.g. Page) gets a `rejected`-colored border. Form is pre-filled with the prior values.

### 5. My stuff (tab root)
- **Purpose:** The reader's own contributions and notes, with review status.
- **Layout:** Screen title + a two-tab bar ("My mentions" / "My notes", underline indicator in `text`/`accent-ink`), then a list.
- **My mentions rows** — flex, gap 12, 1px `line` border. Mini cover 42×60 (per-book gradient), title (14.5px 600) + "attribution · book" (12px `text-2`), and a **status badge** right-aligned:
  - **Personal** (neutral), **Pending** (amber), **Published** (green), **Rejected** (red). A rejected row also shows an inline **reason line** (bg `rejected` soft, 2px left border, `<b>Rejected · </b>` + reason + "Tap to fix & resubmit").
- **My notes rows** — mini cover + the note text in **Newsreader italic 14.5px** + a context line "On **{mention}** · {book}" (12px `text-2`). Notes are always private; no status badge.

### Additional states
- **Note editor bottom sheet** — its own sheet (Cancel · "Your note" · Save), a tall textarea (min-height 120), and a "Private to you · plain text" hint. **Notes are plain text — no rich-text formatting.**
- **Empty states (phrased as invitations):**
  - *My mentions empty* — icon tile, "Spotted a mention we missed?", body about logging + fact-check, primary CTA "Log a mention".
  - *Library search empty* — "No books match yet", body inviting the reader to add the book, CTA "Add a book".
  - App-level CTAs use `accent-ink` (ink button) so they don't compete with the meaningful kind/status colors.

---

## Interactions & Behavior
- **Library card tap →** push Book detail for that book (carry the book's palette).
- **Filter chip tap →** filter the mention list to that kind; "All" clears. Single-select.
- **Mention row tap →** push Mention detail.
- **FAB tap →** present Log-a-mention sheet (kind defaults to the current filter if one is active).
- **Add a note →** present the note bottom sheet; save appends to "Your notes".
- **Submit for review →** move status Personal → Pending. **Reject →** status Rejected + attach reason; tapping a rejected item reopens the modal pre-filled with the reason banner and a **Resubmit** action (→ Pending).
- **Tab switch (My stuff)** swaps the list between mentions and notes.
- Sheets: standard bottom-sheet present/dismiss (slide + scrim fade). Chevrons/back use native stack transitions.
- **Light/Dark:** every screen must support both; follow the neutral + per-mode kind/status token tables below (driven by system color scheme, with optional manual override).

## State Management
- `books[]` (with derived per-kind counts), `mentions[]` (kind, title, attribution, chapter, page, edition, excerpt, why, characterContext, ownerId, **status**: `personal | pending | published | rejected`, `rejectionReason?`), `notes[]` (mentionId, text, createdAt, private).
- UI state: active tab, active filter chip, active My-stuff tab, sheet open/mode (`new | edit | resubmit`), current color scheme.
- Status transitions: `personal → pending` (submit), `pending → published | rejected` (review, later phase), `rejected → pending` (resubmit).
- Data fetching: book list, per-book mentions (published + own), own notes. Own/pending/rejected are visible only to the author until published.

## Design Tokens

### Neutrals (Light / Dark)
- `bg` `#FAF7F1` / `#141109`
- `surface` `#FFFFFF` / `#201B13`
- `surface-2` `#F1ECE2` / `#2A241B`
- `border` `#E7E0D4` / `#39322A`
- `line` (row divider) `#EFE9DE` / `#2C271F`
- `text` `#211C15` / `#F4EFE6`
- `text-2` `#6C6355` / `#B4AB9B`
- `text-3` `#A69B89` / `#7C7365`
- `accent-ink` (app-level CTA) `#241D15` / `#F4EFE6`
- `shadow` (light) `0 1px 2px rgba(40,28,12,.06), 0 8px 20px rgba(40,28,12,.05)` · (dark) `0 1px 2px rgba(0,0,0,.4), 0 10px 24px rgba(0,0,0,.4)`

### Kind colors — fixed app-wide (Light / Dark)
Each kind has a **solid** (icon/text/badge foreground, chip-active) and a **soft** (tile/badge background).
- **Song · teal** — solid `#0E9C9C` / `#33C7C7` · soft `#D6F1F0` / `#0F3130`
- **Movie · coral** — solid `#E15A38` / `#FF7E5C` · soft `#FBE4DC` / `#3A241D`
- **Quote · amber** — solid `#C4890F` / `#EFBB4D` · soft `#F6EBD1` / `#392D13`
- **Book · purple** — solid `#7A5AD6` / `#A78BF2` · soft `#E9E2FB` / `#29203F`
- **Place · blue** — solid `#2E6FDB` / `#5C93F0` · soft `#DDE8FB` / `#15233F`
- **Other · gray** — solid `#8A8074` / `#A79C8D` · soft `#ECE6DC` / `#2B271F`

> **Place is a real 6th kind** (not a relabel of Other) — real locations a book anchors to, e.g. Gatsby's Valley of Ashes. Its icon is a **filled pin**; the outline pin used on the mention-detail *location* row is intentionally kept distinct.

### Status colors — semantic, never themed (Light / Dark)
Foreground / soft-background pairs (badge = soft bg + solid text).
- **Personal · neutral** — `#8A8074` / `#A79C8D` · soft `#ECE6DC` / `#2B271F`
- **Pending · amber** — `#C4890F` / `#EFBB4D` · soft `#F6EBD1` / `#392D13`
- **Published · green** — `#2E9E5B` / `#4CC07D` · soft `#DBEFE3` / `#132C20`
- **Rejected · red** — `#D6443E` / `#F0655E` · soft `#FADEDC` / `#391D1B`

### Per-book palette (derived from cover)
A book palette fills **4 roles**. `header-bg` and `chip-active`/`fab` are the book's primary color; `on-header` is white; `soft-tint` is the primary at ~8% (light) / ~18% (dark), used by the "Yours" badge and tinted surfaces.
- **The Perks of Being a Wallflower — mixtape pink:** primary `#D6397B` · on `#FFFFFF` · soft-tint `#FBE1EC` / `#3A1526` · cover gradient `linear-gradient(160deg,#E24E92,#B21F63)`.
- **The Great Gatsby — dock-light green:** primary `#1E8A5A` · on `#FFFFFF` · soft-tint `#DEF0E7` / `#0F3324` · cover gradient `linear-gradient(160deg,#2AA96E,#0E6E44)`.
- Roles: `header-bg` = primary · `on-header` = #FFFFFF · `chip-active` / `fab` = primary · `soft-tint` = per above.

### Typography
- **Newsreader** (serif) — titles, screen headings, excerpts/pull-quotes, note text. Weights 400/500/600; italic used for excerpts and notes.
- **Hanken Grotesk** (sans) — all UI, body, labels, attribution. Weights 400/500/600/700.
- Scale: mention title Newsreader 600 **27** · screen title Newsreader 600 **22–30** · excerpt Newsreader italic **18** · card/row title Hanken 600 **15** · body Hanken 400 **14** · secondary/attribution Hanken 400 **12.5** · label/badge Hanken 700 **11**, uppercase, +8% letter-spacing.

### Spacing & radius
- Spacing scale (4-based): **4, 8, 12, 16, 20, 24, 32**. Screen horizontal padding 20.
- Radius: chip/pill **20** · input/note **12** · card **18** · FAB **19** · sheet top corners **26** · kind icon tile **10** · cover **9** (mini 6).
- Touch targets ≥ 44pt (search, inputs, FAB, tab items).

## Assets
- **Book covers:** stylized placeholders (per-book CSS gradients). Replace with real cover images where available; keep the gradient as the loading/fallback state. No copyrighted cover art is bundled.
- **Icons:** the prototype draws kind/nav/status icons as inline SVG (music note, play triangle, book = two rects, quote = typographic ", location pin, chevrons, upload/edit/delete, tab glyphs). In the app, substitute equivalent glyphs from your icon library, colored per the tokens above.
- **Fonts:** Newsreader + Hanken Grotesk (Google Fonts). Bundle the same families (or the platform-appropriate packaging) in the app.

## Addenda (post-handoff scope changes — build these too)

These were decided after the original handoff and are reflected in the HTML (Addendum 01–04 sections).

### A1 · New kind: Place
A fixed 6th kind (see token above). The **log-a-mention kind selector now has 6 segments** — Song / Movie / Quote / Book / Place / Other — and fits one row at 393pt (icon + short label, segment gap 5). If labels ever grow, degrade to icon-only rather than wrapping. Place appears in timeline rows, kind badges, and Library count chips exactly like the other kinds.

### A2 · Add-a-book flow (new screen)
Entry: the "Add a book" CTA (Library-search empty state). Presented as a **full-height bottom sheet**.
- **Search** a public book database (Goodreads/Fable-style lookup) → **results list** (cover, title, author/year, per-row "Add") → **confirm step** (large cover + metadata + "Add to my library" primary; caption: saved to the reader's library only — no community publishing/fact-check yet).
- **Loading state**: skeleton rows + spinner + "Searching…".
- **No-results state**: centered magnifier, "No books found for '{query}'", "Try a different title or check the spelling."
- **Scope:** the book is added to the reader's **local library only** (Phase 2 adds community publishing).
- **New book in Library:** the card shows a **"No mentions yet"** pill instead of count chips.
- **Empty Book detail** (a book with 0 curated mentions): normal themed header + filter chips, then a centered empty state — "No mentions yet", "Be the first to catalog the songs, films and places {author} reaches for.", CTA "Log a mention", FAB present.
- **Palette for user-added books:** **derive the primary from the cover image** at add time (dominant vibrant color, contrast-guarded so on-header text stays white/AA). If no cover / derivation fails, use the **house fallback palette** — primary `#4A4038` (light) / `#C8BCAC` (dark). The derived/fallback primary fills the same 4 roles as a curated palette (header, chip-active, FAB, soft-tint).

### A3 · Search across books & mentions
The Library search keeps its "Search books & mentions" scope. Results are **split into two labelled groups**: **Books** (book rows → Book detail) then **Mentions** (kind icon + title + "{attribution} · in {book}" → **Mention detail** directly). A filled search field shows a clear (✕) affordance.
- **Combined empty state** (query matches neither): "No matches for '{query}'", body "We couldn't find a book or a mention. Check the spelling, or add something new.", primary CTA "Add a book" + secondary "or log a mention you spotted". This **replaces** the old book-only "No books match" empty state.

### A4 · Book-level notes
Notes can attach to a **whole book**, not only a mention.
- **Add:** an **overflow (⋯) menu** on the Book-detail header → "Add a note on this book" (+ "Share book"). Opens the same note bottom sheet.
- **Read on Book detail:** existing book-level notes surface in a **pinned card under the filter chips** — "Your notes on this book · {n}", showing the first note (serif italic), expandable.
- **In My notes:** a whole-book note's context line reads **"A note on the book · {book}"** (vs the mention form "On {mention} · {book}").
- **Data model:** a note references either a `mentionId` **or** a `bookId` (book-level), never both.

### Reconciliations (resolve these against the original spec)
- **FAB inset:** **24px** from the right edge (on the spacing scale). Supersedes the 18px seen in the early prototype CSS.
- **Per-book cover gradient:** **one gradient per book**, used identically on the Library card and Book-detail cover. Perks `linear-gradient(160deg,#E24E92,#B21F63)`, Gatsby `linear-gradient(160deg,#2AA96E,#0E6E44)`.
- **Note formatting:** dropped — **notes are plain text.**
- **Data-model note (no UI impact):** the domain status value is `pendingReview` (badge copy stays "Pending"). The four status colors incl. Personal-neutral are adopted as specified.

## Files
- `Novel Mentions.dc.html` — the full design reference: all 5 screens in light + dark, the Gatsby-themed book detail, the owner mention-detail state, My notes tab, note sheet, empty states, and the on-canvas token/type/spacing spec panels.
