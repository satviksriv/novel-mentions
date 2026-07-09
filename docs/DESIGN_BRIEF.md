# Design brief: Novel Mentions

Paste this whole document into the design session as the opening message.
Tracked by issue #2 (import design tokens from the design handoff).

## What the app is

A mobile companion app for readers. For a given novel or memoir, it catalogs
the cultural references the author mentions — songs, movies, quotes, other
books — with where they appear in the book, what they are, why they were
mentioned, and what the character (fiction) or the author (memoir/
autobiography) was thinking at that moment. Readers keep private notes, and
can log mentions they spotted themselves; user-submitted mentions get
fact-checked before being published to other readers (later phase — but the
statuses appear in the UI now).

## Platform and constraints

- Mobile-first. Primary reference device: iPhone 16 (design ~393×852 pt).
- Implementation stack is undecided (React Native + Expo vs Flutter), so use
  standard mobile UI patterns — tabs, stacks, bottom sheets — nothing exotic.
- Light AND dark mode are both required for every screen.

## Navigation

Two bottom tabs: "Library" and "My stuff". Stack navigation on top:
Library → Book detail → Mention detail. "Log a mention" opens as a modal form.

## The 5 MVP screens

1. **Library** — search field; book cards (cover, title, author, per-kind
   mention counts with icons).
2. **Book detail** — header themed to the book's colors; filter chips
   (All / Songs / Movies / Quotes / Books); mentions grouped under
   chapter/part headers in reading order (a chapter timeline); each row: kind
   icon, title, attribution, one-line "why" preview; the reader's own mentions
   appear inline with a "Yours" badge; floating "+" button to log a mention.
3. **Mention detail** — reads top-down: kind badge → title + attribution →
   location (chapter · edition-qualified page) → short excerpt styled as a
   quote → "Why it's here" → "What {character name} was thinking" (uses the
   character's or author's actual name) → "Your notes" list + add note. Own
   mentions also get edit / delete / "Submit for review".
4. **Log/edit a mention (modal)** — kind selector (segmented icons), title,
   attribution, chapter, optional page + edition, short excerpt, why it's
   mentioned, character context. A rejected mention reopens this form
   pre-filled with the reviewer's reason pinned at the top and a "Resubmit"
   action.
5. **My stuff** — tabs "My mentions" / "My notes"; rows show the book and a
   status badge: Personal (neutral), Pending review (amber), Published
   (green), Rejected (red, with the reason line on the card).

Also design: note editor as a bottom sheet, empty states (phrased as
invitations, e.g. "Spotted a mention we missed? Log it").

## Look & feel direction (decided — build on this)

- Vibrant and colorful, not dull. Color should carry meaning:
- Per-book color identity: each book has a palette derived from its cover that
  themes its screens (book detail header, active chips, FAB). Examples used so
  far: The Great Gatsby = green (the dock light), The Perks of Being a
  Wallflower = mixtape pink.
- Fixed kind colors app-wide: songs = teal, movies = coral, quotes = amber,
  books = purple, other = gray. Used on timeline icons, badges, counts.
- Status colors stay semantic: pending = amber/warning, published = green,
  rejected = red.
- Beyond that you have freedom (typography, gradients, texture, illustration).
  The vibe to aim for: warm and literary but playful — a good bookstore meets
  a music app.

## Sample content to design with (real copy, use it)

Book: The Perks of Being a Wallflower — Stephen Chbosky, fiction, 12 mentions.

Mention (song): "Asleep" — The Smiths, 1985. Location: Part one · p. 27
(2012 ed.). Excerpt: "I would give it to Sam because I told her about it, and
I hoped she would like it as much as I do." Why it's here: the song Charlie
puts on every mixtape — his shorthand for feelings he can't say aloud. What
Charlie was thinking: sharing the song is his way of letting Sam see the sad
parts of him without a confession. User note: "Listened while reading this
letter — devastating."

Other mentions for lists: The Catcher in the Rye (book), The Rocky Horror
Picture Show (movie), "Landslide" — Fleetwood Mac (song, user-logged, "Yours"
badge).

Second book: The Great Gatsby — F. Scott Fitzgerald (songs: "Ain't We Got
Fun", "Beale Street Blues"; quotes; real places).

## Deliverables needed back (they will be handed to a developer)

1. All 5 screens in light and dark mode.
2. A color spec: the per-book palette structure (which roles a book palette
   fills: header bg, on-header text, chip active, FAB), the 5 kind colors, the
   3 status colors, and neutrals — as hex tokens, both modes.
3. Type scale and spacing values.
4. Component states: chips active/inactive, all four status badges, empty
   states, the rejected-mention card, the note bottom sheet, FAB.
5. Format: interactive HTML mockups (artifacts) preferred, plus a short
   written spec — those translate to code most faithfully. Screenshots alone
   are okay but lossy.
