import { bookPaletteSchema, colorStringSchema, hexColorSchema } from '../palette';
import { clone, validPalette } from './fixtures';

describe('book palette', () => {
  it('accepts a well-formed palette', () => {
    expect(bookPaletteSchema.safeParse(validPalette).success).toBe(true);
  });

  it('accepts rgba() for soft tints (house fallback shape)', () => {
    const p = clone(validPalette);
    p.softTint.light = 'rgba(74,64,56,0.08)';
    expect(bookPaletteSchema.safeParse(p).success).toBe(true);
  });

  it('requires primary to be a solid hex, not rgba', () => {
    const p = clone(validPalette);
    p.primary.light = 'rgba(30,138,90,0.5)';
    expect(bookPaletteSchema.safeParse(p).success).toBe(false);
  });

  it('rejects a cover gradient that is not exactly two colours', () => {
    const p = clone(validPalette) as { coverGradient: string[] };
    p.coverGradient = ['#2AA96E'];
    expect(bookPaletteSchema.safeParse(p).success).toBe(false);
  });

  it('validates hex and colour-string primitives', () => {
    expect(hexColorSchema.safeParse('#1E8A5A').success).toBe(true);
    expect(hexColorSchema.safeParse('#abc').success).toBe(true);
    expect(hexColorSchema.safeParse('teal').success).toBe(false);
    expect(colorStringSchema.safeParse('rgb(1, 2, 3)').success).toBe(true);
    expect(colorStringSchema.safeParse('not-a-colour').success).toBe(false);
  });
});
