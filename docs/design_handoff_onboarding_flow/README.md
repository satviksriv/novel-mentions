# Handoff: Novel Mentions — Onboarding / First-Run Experience

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behaviour, **not production code to copy directly**. The task is to **recreate these designs in the target codebase's existing environment** (React Native + Expo, SDK 54, managed workflow, running in Expo Go) using its established patterns, component library, and theming — not to ship the HTML.

The codebase **forbids hard-coded hex values and sizes in screens**: everything must map onto the existing token layer. This spec is written so it does — every value below is either an existing token or an explicitly-flagged new one. Do not port the prototype's raw SVG paths or CSS; substitute the codebase's icon set and theme system.

## Fidelity
**High-fidelity.** Final colours (per mode), typography, spacing, radii, and interactions are specified with exact values. Recreate the UI faithfully using the codebase's components. Book covers remain stylized gradient placeholders (per the base handoff); wire real cover art into those slots when available.

## Files in this bundle
- **README.md** — this document. Self-sufficient: the full onboarding spec follows below.
- **Onboarding.dc.html** — visual reference for the *new* onboarding work (all beats + states, light & dark). Prototype only.
- **base-system/Novel Mentions.dc.html** — the *existing* shipped screens (Library, Book detail, Mention detail, Log sheet, My stuff) this feature extends. Reference for shared components and the on-canvas token panels.
- **base-system/README.md** — the original design-system handoff: the authoritative token layer (neutrals, kind/status/per-book palettes, type, spacing, radii). **The onboarding spec reuses these tokens; read it for any token not redefined here.**

## How to use this package
1. Read `base-system/README.md` to load the token layer and shared components.
2. Read the onboarding spec below and open `Onboarding.dc.html` alongside it for the visuals.
3. Implement against the existing token layer — the spec adds **no new colour/type/radius tokens** (one new scrim value and three boolean state flags are the only additions, both flagged).

---

## Overview
The first-run / onboarding experience — everything a reader sees **before** the Library, plus the light-touch cues that teach the app in place afterward. It closes the gap the original handoff left: a new user currently opens straight into the Library with no idea what the app is for, and the two curated books read as if the reader already owns them.

This addendum extends the shipped design system. **It introduces no new colour, type, or radius tokens** — every surface reuses the neutral layer, CTAs use `accent-ink` exactly like the existing app-level empty-state buttons, and the kind/status/per-book palettes are left untouched so they keep meaning what they already mean. New entries are structural only: a welcome pager, a coach-mark tip, an "Included" section band, and the Library overflow menu.

- **Reference device:** iPhone 16 (~393 × 852 pt), matching the base handoff.
- **Modes:** light + dark, driven by system colour scheme (same as every other screen).
- **Type:** Newsreader (serif — beat titles) + Hanken Grotesk (sans — all UI/body), both already loaded.
- **Visual reference:** `Onboarding.dc.html` (prototype only — do not port raw SVG/CSS).

---

## The decisions (answering the brief)

**1. How many beats, and is it swipeable / a single scroll?**
A **hybrid**, not a full carousel. Three swipeable welcome beats → hand off into the *real* Library → one-time contextual cues teach browsing/logging in place. Rationale: a five-slide carousel front-loads every feature before the reader has touched anything, then drops them into an empty-feeling app. Three beats cover only *idea → what you can do → the books you already have*; the rest is taught where it's used.

- **Beat 1 — What it is.** Establishes the core idea and the six-kind colour language (the kind chips are the hero visual).
- **Beat 2 — What you can do.** Three moves: browse curated mentions, keep private notes (mention **or** whole book), log what you spot & add books.
- **Beat 3 — The starter shelf.** Frames the two curated books as **ours**, and folds in the offline/local reassurance ("no account, nothing to sign up for").

Beats are horizontally **paged** (swipe or tap the → button). The pager is 3 dots.

**2. Skip / dismiss & re-view.**
- "Skip" text button top-right on **beats 1–2** → jumps straight to the Library (sets `welcomeSeen`). Beat 3 has no Skip; its primary CTA is the exit.
- The whole welcome is **re-viewable** from a new **⋯ overflow menu** on the Library header → *"How Novel Mentions works"*. (The app has no settings screen; the Library header is its natural home, and A4 already established a `⋯` header pattern on Book detail.)
- The in-place cues (Library tip, FAB tip) are **one-time** — once dismissed they do **not** return, and are not re-triggerable. Only the welcome beats are re-viewable.

**3. Hand-off target.**
Into the **Library tab root**, deliberately — the Library is where the "these two books are ours" framing has to land, and it's one tap from either book. The last beat's CTA reads **"Open the Library."**

**4. Lighter-touch alternative vs a carousel.**
Adopted the hybrid above rather than a pure carousel. The carousel's usual job (explain logging, notes, adding books) is instead done by (a) one beat of orientation and (b) contextual coach-marks anchored to the real controls — so the teaching happens the moment it's relevant, and the empty-shelf problem is solved by framing the starters rather than by more slides.

**The "these two books are ours" point lands twice:** once as a dedicated welcome beat, and once as a **persistent** Library treatment (an "Included to get you started" section band + an "Included" tag on each starter card). The band is durable — it stays after onboarding, and any books the reader adds appear below under a second **"Your library"** band, so the provenance line never blurs.

---

## Screens / Views

### O1. Welcome pager (first launch only)
Full-bleed neutral canvas (`bg`), status bar + home indicator visible, **no tab bar**. Layout is a flex column: top row (Skip) → art area (flex, centered) → copy block (left-aligned) → footer (pager dots + advance control).

- **Container:** absolute inset below the 52px status bar; padding `8px 24px 30px`.
- **Skip:** top-right, Hanken 600, 14px, `text-2`. Present on beats 1–2 only. Hit target ≥ 44pt.
- **Eyebrow:** Hanken 700, 12px, uppercase, letter-spacing +0.14em, `text-3`. ("Welcome" / "Yours to build on" / "On us".)
- **Beat title:** Newsreader 600, **30px**, line-height 1.05, letter-spacing −0.01em, `text` (reuses the `.h1` screen-title preset — no new size).
- **Beat body:** Hanken 400, 15.5px, line-height 1.55, `text-2`; inline emphasis in `text` 600.
- **Pager dots:** row, gap 8. Inactive dot 7×7 circle, `text-3` at 45% opacity. Active dot 22×7 pill, radius 4, `accent-ink`.
- **Advance control (beats 1–2):** 52×52 circle, bg `accent-ink`, arrow glyph in `bg`, bottom-right.
- **Primary CTA (beat 3):** full-width, height 52, radius **16**, bg `accent-ink`, label in `bg`, Hanken 700 15px — same treatment as the existing empty-state CTAs. Copy: **"Open the Library."**
- **Local-only footnote (beat 3):** centered under the CTA, Hanken 400, 12.5px, `text-3`, with a small lock glyph: *"Everything stays on your device. No account, nothing to sign up for."*

**Beat 1 art** — the six kind chips (`Songs / Movies / Quotes / Books / Places / Other`) laid out wrapping/centered, each using the count-chip recipe: solid kind colour on soft kind bg (`--k` on `--k-bg`), radius 12, Hanken 700 14.5px, kind glyph + label. This is where the colour language is introduced.

**Beat 2 art** — three feature rows, gap 22. Each: a 46×46 icon tile (radius 13, bg `surface-2`, glyph in `text`) + title (Hanken 600, 16px, `text`) + description (Hanken 400, 13.5px, `text-2`, line 1.44). Tiles are **neutral** (not kind-coloured) so they don't compete with beat 1's colour lesson.
  - *Browse curated mentions* — "Every reference in reading order, grouped by chapter, filterable by kind."
  - *Keep private notes* — "On a single mention, or on a whole book. Only you ever see them."
  - *Log what you spot — and add books* — "Catch a reference we missed? Log it. Add any book to build your own library."

**Beat 3 art** — the two starter covers side by side (118×168, radius 11, per-book gradient, spine line, serif title, uppercase author) each carrying a small **"Included"** overlay chip (top-left, translucent white `rgba(255,255,255,.92)` on the cover, ink text `#3a2f22` — an on-cover overlay like the existing `cover.img` tag, not a themed token) and a count-chip row beneath.

### O2. Library, primed (the hand-off target — a modification of Screen 1)
The existing Library, with three additions. All other Library spec is unchanged.

1. **`⋯` overflow button** in the header. Header title row becomes a space-between row: title+subline on the left, a 36×36 button on the right (radius 11, glyph `text-2`, margin-top 8 to align to the title baseline). ≥ 44pt hit target.
2. **"Included to get you started" section band**, placed above the two starter cards. **Reuses the chapter-header pattern** verbatim: uppercase label (Hanken 700, 11px, +0.09em, `text-3`) + a 1px `border` rule filling the remaining width.
3. **"Included" card tag** — inline after each starter card's title: Hanken 700, 9.5px, uppercase, +0.05em, `text-2` on `surface-2`, radius 6.

When the reader adds their own book (A2 flow), it appears under a second band **"Your library"** (same pattern) below the included section. If the reader has added nothing, only the "Included" band shows.

### O3. First-run contextual cues (coach-marks)
Lightweight, one-time, dismissible callouts anchored to real controls. **No new colour tokens** — a `surface` card with `border` and `shadow`, plus a rotated `surface`/`border` square as the pointer.

- **Card:** bg `surface`, 1px `border`, radius 14, `shadow`, padding 13×15.
- **Title:** Hanken 600, 14px, `text` (optional 26×26 `surface-2` accent tile with a small glyph, `text-2`).
- **Body:** Hanken 400, 12.5px, `text-2`, line 1.42.
- **Dismiss:** "Got it", Hanken 700, 13px, `accent-ink`. Tapping sets the relevant seen-flag.
- **Pointer:** 15×15 square rotated 45°, filled `surface` with the two facing edges bordered `border`, positioned against the anchored side.

Two instances:
- **Library tip** (`libraryTipSeen`) — appears below the search field on the first Library view after onboarding, pointer up toward the search/first card. Copy: *"Open a book to explore its mentions — start with Gatsby or Perks, they're already catalogued."*
- **Book-detail FAB tip** (`fabTipSeen`) — appears the first time any book detail is opened, floating bottom-right above the FAB (width ~214, pointer down toward the +). Copy: *"Spotted one we missed? Tap + to log a mention and add it to this book."*

Only one coach-mark is ever shown at a time; the FAB tip waits until the reader is on a book detail.

### O4. Re-view — Library `⋯` menu
Tapping the header `⋯` opens a popover (top-right, min-width 224) over a light scrim.

- **Scrim:** `rgba(12,8,3,.28)` light / `rgba(0,0,0,.42)` dark — intentionally lighter than the modal scrim (`rgba(12,8,3,.5)`), because this is a menu, not a full modal.
- **Popover:** bg `surface`, 1px `border`, radius 14, elevated shadow `0 8px 30px rgba(0,0,0,.18)`, padding 6.
- **Items:** flex row, gap 12, padding 11×12, radius 10, Hanken 500 14px `text`, leading glyph `text-2`; 1px `line` divider between items.
  - **How Novel Mentions works** → replays the welcome pager (O1) as a dismissible modal.
  - **About Novel Mentions** → short about sheet (version, "made for readers", the local-only note). Reuse the standard bottom-sheet shell.

---

## Token map (all existing — nothing new to add to the token layer)

| Onboarding element | Token(s) | Light | Dark |
|---|---|---|---|
| Welcome canvas bg | `bg` | `#FAF7F1` | `#141109` |
| Beat title | `text` | `#211C15` | `#F4EFE6` |
| Beat body, feature desc | `text-2` | `#6C6355` | `#B4AB9B` |
| Eyebrow, dots (inactive), footnote | `text-3` | `#A69B89` | `#7C7365` |
| "Skip" | `text-2` | `#6C6355` | `#B4AB9B` |
| Feature icon tile bg | `surface-2` | `#F1ECE2` | `#2A241B` |
| Feature icon glyph | `text` | `#211C15` | `#F4EFE6` |
| Kind chips (beat 1) | `--k` / `--k-bg` | per kind (unchanged) | per kind (unchanged) |
| Pager dot (active), CTA/next bg | `accent-ink` | `#241D15` | `#F4EFE6` |
| CTA/next label | `bg` | `#FAF7F1` | `#141109` |
| Coach-mark & FAB tip card | `surface` / `border` / `shadow` | `#FFFFFF` / `#E7E0D4` | `#201B13` / `#39322A` |
| "Got it" dismiss | `accent-ink` | `#241D15` | `#F4EFE6` |
| "Included…" band label + rule | `text-3` + `border` rule | `#A69B89` / `#E7E0D4` | `#7C7365` / `#39322A` |
| "Included" card tag | `text-2` on `surface-2` | `#6C6355` / `#F1ECE2` | `#B4AB9B` / `#2A241B` |
| `⋯` button glyph | `text-2` | `#6C6355` | `#B4AB9B` |
| `⋯` popover | `surface` / `border` | `#FFFFFF` / `#E7E0D4` | `#201B13` / `#39322A` |
| Menu divider | `line` | `#EFE9DE` | `#2C271F` |
| Menu scrim | *(new value)* | `rgba(12,8,3,.28)` | `rgba(0,0,0,.42)` |

The only genuinely new value is the **menu scrim** — lighter than the existing modal scrim. If you prefer to avoid a one-off, reuse the modal scrim `rgba(12,8,3,.5)`; a lighter scrim is a deliberate softening for a non-modal menu.

### On-cover overlay (not a themed token, same family as `cover.img`)
- **Beat-3 "Included" cover chip:** bg `rgba(255,255,255,.92)`, text `#3a2f22`, radius 5.

---

## Type presets (all reused)
| Use | Family / weight / size |
|---|---|
| Beat title | Newsreader 600 · 30 · −0.01em (`.h1`) |
| Eyebrow / band label / card tag | Hanken 700 · 11–12 · uppercase · +0.09–0.14em |
| Beat body / feature desc | Hanken 400 · 15.5 / 13.5 · line 1.44–1.55 |
| Feature title | Hanken 600 · 16 |
| CTA | Hanken 700 · 15 |
| Menu item | Hanken 500 · 14 |
| "Got it" dismiss | Hanken 700 · 13 |
| Footnote / tip body | Hanken 400 · 12.5 |

## Spacing & radius (all on the existing scale)
- Screen padding 20 (Library) / welcome padding `8 · 24 · 30`.
- Spacing between feature rows 22; beat art↔copy 24; dots↔advance 18.
- Radii: CTA **16**, tip / search **14**, feature tile / mention-note **13**, menu item / band tag reuse 6–12, next-button 50% circle. All already on the radius scale (chip 20 · card 18 · CTA-tier 16 · input 12–14 · tile 10–13 · tag 6).
- Touch targets: Skip, ⋯, next-button, CTA all ≥ 44pt.

---

## Interactions & Behaviour
- **First launch** (`welcomeSeen` false) → present the welcome pager modally over the Library before it's interactive.
- **Beat advance** → swipe left / tap → button; dots reflect index. **Skip** (beats 1–2) or **Open the Library** (beat 3) → dismiss pager, set `welcomeSeen`.
- **After dismiss** → land on Library; if `libraryTipSeen` false, show the Library coach-mark. Dismiss on "Got it" or on first card tap → set `libraryTipSeen`.
- **First book detail opened** (`fabTipSeen` false) → show the FAB coach-mark; "Got it" or tapping the FAB → set `fabTipSeen`.
- **Library `⋯` → How Novel Mentions works** → replay the pager (from beat 1) as a dismissible modal; does **not** reset the coach-mark flags.
- **`⋯` → About** → present the about sheet.
- Coach-marks are one-shot: never re-shown once their flag is set.

## State (new — additive to the existing UI-state model)
- `welcomeSeen: boolean`
- `libraryTipSeen: boolean`
- `fabTipSeen: boolean`

All three persisted to **AsyncStorage** (local-only app; no accounts). Because there's no backend, no data is fetched or posted during onboarding — it's pure client state. Provide a dev/debug affordance to reset the flags for QA. No changes to `books[]`, `mentions[]`, or `notes[]`.

## Implementation notes (React Native + Expo, SDK 54, Expo Go)
- **Pager:** a horizontal `FlatList`/`ScrollView` with `pagingEnabled` (or `react-native-pager-view` if already in use). No exotic animation libs needed.
- **Coach-marks:** absolutely-positioned views with a small rotated pointer; anchor by measuring the target (`onLayout`) or by fixed insets matching the reference. No portal/overlay library required.
- **Overflow menu:** a small popover — a `Modal` with a light scrim + an absolutely-positioned card, or the platform action-menu if preferred; either matches the spec.
- **Provenance flag:** starter books need an `isIncluded` (or `source: 'bundled'`) attribute so the Library can sort them under the "Included" band and render the tag; user-added books render under "Your library". This is the one small data-shape addition on the book model.
- Everything else composes from existing components — no new colour/type/radius tokens enter the token layer.
