/**
 * Design tokens — the single source of truth for Novel Mentions' visual system.
 *
 * Values are transcribed verbatim from the design handoff
 * (docs/design_handoff_novel_mentions/README.md → "Design Tokens"; its Addenda
 * supersede the body). Screens must consume these tokens via the theme layer
 * (see theme.ts / ThemeContext.tsx) and never hard-code hexes or sizes.
 *
 * Mode-dependent values are stored as { light, dark } and resolved for the
 * active color scheme by resolveTheme().
 */
import type { TextStyle } from 'react-native';

// The mention vocabularies and the per-book palette shape are owned by the
// domain layer (their single source of truth); the theme keys its colour tables
// to them. Consumers import these types from '@/domain' directly — the theme
// only uses them internally here. (Domain owns the *stored* palette shape as
// BookPaletteSource; theme.ts owns the resolved, scheme-flattened BookPalette.)
import type { BookPaletteSource, MentionKind, MentionStatus, ModeValue } from '@/domain';

export type ColorScheme = 'light' | 'dark';

/** A foreground (solid) + background (soft) colour pair, per mode. */
export type ColorPair = { readonly solid: ModeValue<string>; readonly soft: ModeValue<string> };

// ---------------------------------------------------------------------------
// Neutrals (Light / Dark)
// ---------------------------------------------------------------------------
export const NEUTRALS = {
  bg: { light: '#FAF7F1', dark: '#141109' },
  surface: { light: '#FFFFFF', dark: '#201B13' },
  surface2: { light: '#F1ECE2', dark: '#2A241B' },
  border: { light: '#E7E0D4', dark: '#39322A' },
  line: { light: '#EFE9DE', dark: '#2C271F' },
  text: { light: '#211C15', dark: '#F4EFE6' },
  text2: { light: '#6C6355', dark: '#B4AB9B' },
  text3: { light: '#A69B89', dark: '#7C7365' },
  /** App-level CTA ink (so CTAs don't compete with kind/status colours). */
  accentInk: { light: '#241D15', dark: '#F4EFE6' },
} as const satisfies Record<string, ModeValue<string>>;

/** Elevation, as a CSS-style boxShadow string (supported natively in RN 0.86). */
export const SHADOW = {
  card: {
    light: '0px 1px 2px rgba(40,28,12,0.06), 0px 8px 20px rgba(40,28,12,0.05)',
    dark: '0px 1px 2px rgba(0,0,0,0.4), 0px 10px 24px rgba(0,0,0,0.4)',
  },
} as const satisfies Record<string, ModeValue<string>>;

// ---------------------------------------------------------------------------
// Kind colours — fixed app-wide (Light / Dark). solid = fg, soft = bg.
// ---------------------------------------------------------------------------
export const KIND_COLORS = {
  song: { solid: { light: '#0E9C9C', dark: '#33C7C7' }, soft: { light: '#D6F1F0', dark: '#0F3130' } },
  movie: { solid: { light: '#E15A38', dark: '#FF7E5C' }, soft: { light: '#FBE4DC', dark: '#3A241D' } },
  quote: { solid: { light: '#C4890F', dark: '#EFBB4D' }, soft: { light: '#F6EBD1', dark: '#392D13' } },
  book: { solid: { light: '#7A5AD6', dark: '#A78BF2' }, soft: { light: '#E9E2FB', dark: '#29203F' } },
  place: { solid: { light: '#2E6FDB', dark: '#5C93F0' }, soft: { light: '#DDE8FB', dark: '#15233F' } },
  other: { solid: { light: '#8A8074', dark: '#A79C8D' }, soft: { light: '#ECE6DC', dark: '#2B271F' } },
} as const satisfies Record<MentionKind, ColorPair>;

// ---------------------------------------------------------------------------
// Status colours — semantic, never themed (Light / Dark). badge = soft + solid.
// ---------------------------------------------------------------------------
export const STATUS_COLORS = {
  personal: { solid: { light: '#8A8074', dark: '#A79C8D' }, soft: { light: '#ECE6DC', dark: '#2B271F' } },
  pendingReview: { solid: { light: '#C4890F', dark: '#EFBB4D' }, soft: { light: '#F6EBD1', dark: '#392D13' } },
  published: { solid: { light: '#2E9E5B', dark: '#4CC07D' }, soft: { light: '#DBEFE3', dark: '#132C20' } },
  rejected: { solid: { light: '#D6443E', dark: '#F0655E' }, soft: { light: '#FADEDC', dark: '#391D1B' } },
} as const satisfies Record<MentionStatus, ColorPair>;

// ---------------------------------------------------------------------------
// Per-book palette (derived from cover) — fills 4 roles; on-header is white.
// Curated books carry explicit hexes in seed JSON (issue #4/#5); these two are
// the handoff samples and document the shape resolveBookPalette() expects.
// ---------------------------------------------------------------------------
export const CURATED_BOOK_PALETTES = {
  /** The Perks of Being a Wallflower — mixtape pink. */
  perks: {
    primary: { light: '#D6397B', dark: '#D6397B' },
    softTint: { light: '#FBE1EC', dark: '#3A1526' },
    coverGradient: ['#E24E92', '#B21F63'],
  },
  /** The Great Gatsby — dock-light green. */
  gatsby: {
    primary: { light: '#1E8A5A', dark: '#1E8A5A' },
    softTint: { light: '#DEF0E7', dark: '#0F3324' },
    coverGradient: ['#2AA96E', '#0E6E44'],
  },
} as const satisfies Record<string, BookPaletteSource>;

export type CuratedBookPaletteKey = keyof typeof CURATED_BOOK_PALETTES;

/**
 * House fallback for user-added books when cover derivation fails.
 * Primary is specified by the handoff; soft-tint follows the ~8%/18% rule as
 * an alpha over the primary, and the gradient shades the primary.
 */
export const HOUSE_FALLBACK_PALETTE: BookPaletteSource = {
  primary: { light: '#4A4038', dark: '#C8BCAC' },
  softTint: { light: 'rgba(74,64,56,0.08)', dark: 'rgba(200,188,172,0.18)' },
  coverGradient: ['#5A4E44', '#33291F'],
};

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
/**
 * Loaded font family names. These match the @expo-google-fonts export names
 * registered at app start (wired in a follow-up step); until loaded, the
 * platform falls back gracefully.
 */
export const FONT_FAMILY = {
  serif: 'Newsreader_400Regular',
  serifMedium: 'Newsreader_500Medium',
  serifSemiBold: 'Newsreader_600SemiBold',
  serifItalic: 'Newsreader_400Regular_Italic',
  serifSemiBoldItalic: 'Newsreader_600SemiBold_Italic',
  sans: 'HankenGrotesk_400Regular',
  sansMedium: 'HankenGrotesk_500Medium',
  sansSemiBold: 'HankenGrotesk_600SemiBold',
  sansBold: 'HankenGrotesk_700Bold',
} as const;

/**
 * Semantic type presets (ready to spread into a Text style). Newsreader (serif)
 * for titles/excerpts/notes; Hanken Grotesk (sans) for all UI/body/labels.
 * Weight comes from the family name, so we don't also set fontWeight.
 */
export const TYPE = {
  /** Library screen title. */
  screenTitle: { fontFamily: FONT_FAMILY.serifSemiBold, fontSize: 30, lineHeight: 36 },
  /** Mention-detail title. */
  mentionTitle: { fontFamily: FONT_FAMILY.serifSemiBold, fontSize: 27, lineHeight: 32 },
  /** Book-detail header title. */
  bookHeaderTitle: { fontFamily: FONT_FAMILY.serifSemiBold, fontSize: 23, lineHeight: 28 },
  /** Library card title. */
  cardTitle: { fontFamily: FONT_FAMILY.serifSemiBold, fontSize: 18.5, lineHeight: 23 },
  /** Pull-quote excerpt (serif italic). */
  excerpt: { fontFamily: FONT_FAMILY.serifItalic, fontStyle: 'italic', fontSize: 18.5, lineHeight: 27 },
  /** Note body (serif italic). */
  note: { fontFamily: FONT_FAMILY.serifItalic, fontStyle: 'italic', fontSize: 14.5, lineHeight: 21 },
  /** Card / row title (sans). */
  rowTitle: { fontFamily: FONT_FAMILY.sansSemiBold, fontSize: 15, lineHeight: 20 },
  /** Body copy. */
  body: { fontFamily: FONT_FAMILY.sans, fontSize: 14, lineHeight: 21 },
  /** Secondary / attribution. */
  secondary: { fontFamily: FONT_FAMILY.sans, fontSize: 12.5, lineHeight: 17 },
  /** Screen subline. */
  subline: { fontFamily: FONT_FAMILY.sans, fontSize: 13, lineHeight: 18 },
  /** Label / badge — uppercase, +8% tracking. */
  label: {
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  },
} as const satisfies Record<string, TextStyle>;

// ---------------------------------------------------------------------------
// Spacing & radius
// ---------------------------------------------------------------------------
/** 4-based spacing scale (4, 8, 12, 16, 20, 24, 32). Screen horizontal padding = 20. */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  /** Screen horizontal padding. */
  screen: 20,
} as const;

export const RADIUS = {
  pill: 20,
  input: 12,
  note: 12,
  card: 18,
  fab: 19,
  sheet: 26,
  tile: 10,
  cover: 9,
  coverMini: 6,
} as const;
