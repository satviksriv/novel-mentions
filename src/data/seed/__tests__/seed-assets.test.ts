/**
 * Integrity checks for the bundled seed assets. These run the real domain
 * schema over the shipped JSON, so a malformed edit (bad UUID, over-long
 * excerpt, a user-sourced or unpublished seed mention, a mismatched bookId)
 * fails CI instead of the app. Content lives in ../*.seed.json; the repository
 * layer (issue #6) loads these same files through a SeedSource.
 */
import { parseSeedBook, type SeedBook } from '@/domain';

import gatsby from '../gatsby.seed.json';
import perks from '../perks.seed.json';

const ASSETS: readonly (readonly [string, unknown])[] = [
  ['gatsby.seed.json', gatsby],
  ['perks.seed.json', perks],
];

describe('bundled seed assets', () => {
  it.each(ASSETS)('%s parses against the seed schema', (_name, raw) => {
    expect(() => parseSeedBook(raw)).not.toThrow();
  });

  describe.each(ASSETS)('%s', (_name, raw) => {
    const seed: SeedBook = parseSeedBook(raw);

    it('is a seed-origin book at the current schema version', () => {
      expect(seed.schemaVersion).toBe(1);
      expect(seed.book.origin).toBe('seed');
      expect(seed.book.title.length).toBeGreaterThan(0);
    });

    it('carries a curated palette (primary + gradient)', () => {
      expect(seed.book.palette.primary.light).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(seed.book.palette.coverGradient).toHaveLength(2);
    });

    it('has 8–12 curated, published mentions of mixed kinds', () => {
      expect(seed.mentions.length).toBeGreaterThanOrEqual(8);
      expect(seed.mentions.length).toBeLessThanOrEqual(12);

      for (const m of seed.mentions) {
        expect(m.bookId).toBe(seed.book.id);
        expect(m.status).toBe('published');
        expect(m.source).not.toBe('user');
        expect(m.contributorRef).toBeNull();
        expect(m.whyMentioned.length).toBeGreaterThan(0);
      }

      const kinds = new Set(seed.mentions.map((m) => m.kind));
      expect(kinds.size).toBeGreaterThanOrEqual(3);
    });

    it('has unique mention ids', () => {
      const ids = seed.mentions.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('gives each book a distinct id, with no id shared across books', () => {
    const [g, p] = ASSETS.map(([, raw]) => parseSeedBook(raw));
    expect(g.book.id).not.toBe(p.book.id);

    const everyId = [g, p].flatMap((s) => [s.book.id, ...s.mentions.map((m) => m.id)]);
    expect(new Set(everyId).size).toBe(everyId.length);
  });
});
