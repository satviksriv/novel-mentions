/**
 * Palette derivation for user-added books (issue #12).
 *
 * True dominant-colour extraction from the cover image needs pixel access,
 * which on Expo Go means a native module — off-limits in Phase 1. So instead of
 * reading the cover, we derive a *deterministic* palette from the book's
 * identity (title + author hashed to a hue), guarded so white on-header text
 * stays legible. Same book ⇒ same colours every time; different books look
 * distinct. Cover-pixel derivation can replace this in a later phase (EAS dev
 * build) without touching callers — the returned shape is the curated one.
 *
 * The guard mirrors the curated palettes, which sit around AA-large contrast
 * (the Gatsby green #1E8A5A is ~4.3:1 on white); we target ~4:1 so derived
 * primaries read as rich, not muddy.
 */
import { bookPaletteSchema, type BookPaletteSource } from './palette';

type Rgb = readonly [number, number, number];

/** FNV-1a hash of a string → a hue in [0, 360). */
function hashToHue(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 360;
}

function hslToRgb(h: number, s: number, l: number): Rgb {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = ((((h % 360) + 360) % 360) / 60);
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] =
    hp < 1 ? [c, x, 0]
    : hp < 2 ? [x, c, 0]
    : hp < 3 ? [0, c, x]
    : hp < 4 ? [0, x, c]
    : hp < 5 ? [x, 0, c]
    : [c, 0, x];
  const m = l - c / 2;
  return [Math.round((r1 + m) * 255), Math.round((g1 + m) * 255), Math.round((b1 + m) * 255)];
}

const toHex = (n: number) => n.toString(16).padStart(2, '0');
const rgbToHex = ([r, g, b]: Rgb) => `#${toHex(r)}${toHex(g)}${toHex(b)}`;

/** WCAG relative luminance of an sRGB colour. */
export function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio of a colour against white (#FFF, luminance 1.0). */
export function contrastWithWhite(rgb: Rgb): number {
  return 1.05 / (relativeLuminance(rgb) + 0.05);
}

/**
 * A hue's colour at a fixed saturation, darkened just until it clears the
 * target contrast against white. Returns the hex and the lightness it settled
 * at (so the cover gradient can build a lighter sibling shade).
 */
function guardedColor(hue: number, sat: number, targetContrast: number): { hex: string; l: number } {
  const maxLuminance = 1.05 / targetContrast - 0.05;
  let l = 0.46;
  let rgb = hslToRgb(hue, sat, l);
  while (relativeLuminance(rgb) > maxLuminance && l > 0.14) {
    l -= 0.02;
    rgb = hslToRgb(hue, sat, l);
  }
  return { hex: rgbToHex(rgb), l };
}

/**
 * Derive a deterministic, contrast-guarded palette from a book's identity
 * (typically `"{title}|{author}"`). Fills the same four roles as a curated
 * palette: header/chip/FAB primary, soft tint (light + dark), and the cover
 * gradient. Returns a validated `BookPaletteSource`.
 *
 * The spec's house fallback (for "no cover / derivation fails") lives in the
 * theme layer (`HOUSE_FALLBACK_PALETTE`); this path never fails, so it isn't
 * needed here — an empty seed still hashes to a valid, stable palette.
 */
export function deriveBookPalette(seed: string): BookPaletteSource {
  const hue = hashToHue(seed.trim());
  const sat = 0.62;
  const { hex: primary, l } = guardedColor(hue, sat, 4.0);

  return bookPaletteSchema.parse({
    primary: { light: primary, dark: primary },
    softTint: {
      light: rgbToHex(hslToRgb(hue, 0.45, 0.9)),
      dark: rgbToHex(hslToRgb(hue, 0.5, 0.13)),
    },
    // Lighter sibling → the guarded primary, matching the curated gradients
    // (e.g. Gatsby #2AA96E → #0E6E44).
    coverGradient: [rgbToHex(hslToRgb(hue, sat + 0.06, Math.min(l + 0.14, 0.5))), primary],
  });
}
