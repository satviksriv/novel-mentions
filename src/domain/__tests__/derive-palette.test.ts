import { bookPaletteSchema } from '../palette';
import { contrastWithWhite, deriveBookPalette, relativeLuminance } from '../derive-palette';

/** Parse a #rrggbb string to an [r,g,b] tuple. */
function hexToRgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) throw new Error(`not a 6-digit hex: ${hex}`);
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

describe('deriveBookPalette', () => {
  it('is deterministic — same seed yields the same palette', () => {
    expect(deriveBookPalette('The Bell Jar|Sylvia Plath')).toEqual(
      deriveBookPalette('The Bell Jar|Sylvia Plath'),
    );
  });

  it('returns a valid BookPaletteSource', () => {
    expect(() => bookPaletteSchema.parse(deriveBookPalette('Beloved|Toni Morrison'))).not.toThrow();
  });

  it('varies the primary across different books', () => {
    const a = deriveBookPalette('Beloved|Toni Morrison').primary.light;
    const b = deriveBookPalette('Dune|Frank Herbert').primary.light;
    expect(a).not.toBe(b);
  });

  it('guards the primary for legible white on-header text (AA-large, ~3:1+)', () => {
    for (const seed of ['Beloved|Toni Morrison', 'Dune|Frank Herbert', '1984|George Orwell', 'It|Stephen King']) {
      const primary = deriveBookPalette(seed).primary.light;
      expect(contrastWithWhite(hexToRgb(primary))).toBeGreaterThanOrEqual(3);
    }
  });

  it('still returns a valid, stable palette for an empty seed', () => {
    expect(() => bookPaletteSchema.parse(deriveBookPalette('   '))).not.toThrow();
    expect(deriveBookPalette('')).toEqual(deriveBookPalette('   '));
  });
});

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance([0, 0, 0])).toBeCloseTo(0, 5);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 5);
  });
});
