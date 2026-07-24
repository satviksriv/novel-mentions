/**
 * Per-book colour palette — the stored data shape (curated hexes in seed JSON;
 * derived from the cover for user-added books in a later issue).
 *
 * This lives in the domain layer, not the theme, because a book's palette is
 * *data* that travels in seed assets and future API payloads. The theme layer
 * imports `ModeValue` / `BookPaletteSource` from here (via tokens.ts) and
 * resolves them for the active colour scheme (its flattened result type is
 * named `BookPalette`) — domain never depends on the theme.
 */
import { z } from 'zod';

/** A value that differs between light and dark mode. */
export type ModeValue<T> = { readonly light: T; readonly dark: T };

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const RGB = /^rgba?\(\s*[\d.\s,%/]+\)$/i;

/** A solid colour, authored as a hex string (e.g. #1E8A5A). */
export const hexColorSchema = z.string().regex(HEX, 'must be a hex colour, e.g. #1E8A5A');

/** A colour that may be hex or rgb/rgba() — soft tints use rgba (house fallback). */
export const colorStringSchema = z
  .string()
  .refine((v) => HEX.test(v) || RGB.test(v), 'must be a hex or rgb/rgba colour');

const modePair = <T extends z.ZodTypeAny>(inner: T) =>
  z.object({ light: inner, dark: inner }).readonly();

export const bookPaletteSchema = z
  .object({
    /** header-bg / active chip / FAB. */
    primary: modePair(hexColorSchema),
    /** primary at low opacity; "Yours" badge and tinted surfaces. */
    softTint: modePair(colorStringSchema),
    /** One 160° gradient per book, used identically on card + book-detail cover. */
    coverGradient: z.tuple([hexColorSchema, hexColorSchema]).readonly(),
  })
  .readonly();

/** The stored per-book palette (light/dark source values), as opposed to the
 *  theme's scheme-resolved `BookPalette`. */
export type BookPaletteSource = z.infer<typeof bookPaletteSchema>;
