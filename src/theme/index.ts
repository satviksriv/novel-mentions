/** Public surface of the theme layer. */

// Design tokens. Listed explicitly rather than `export *` — a re-export star
// over a module that imports from '@/domain' trips eslint-plugin-import's
// export rule (it phantom-expands the domain import), and an explicit surface
// is clearer anyway. Shared domain types live in '@/domain', not here.
export {
  CURATED_BOOK_PALETTES,
  FONT_FAMILY,
  HOUSE_FALLBACK_PALETTE,
  KIND_COLORS,
  NEUTRALS,
  RADIUS,
  SHADOW,
  SPACING,
  STATUS_COLORS,
  TYPE,
  type ColorPair,
  type ColorScheme,
  type CuratedBookPaletteKey,
} from './tokens';
export { resolveBookPalette, resolveTheme, type BookPalette, type Theme } from './theme';
export { ThemeProvider, useBookPalette, useTheme } from './ThemeContext';
