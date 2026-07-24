import { SEED_SCHEMA_VERSION, seedBookSchema } from '../seed';
import { clone, validSeedBook } from './fixtures';

describe('SeedBook schema', () => {
  it('parses a valid seed document', () => {
    const seed = seedBookSchema.parse(validSeedBook);
    expect(seed.schemaVersion).toBe(SEED_SCHEMA_VERSION);
    expect(seed.book.origin).toBe('seed');
    expect(seed.mentions).toHaveLength(1);
  });

  it('rejects a wrong schemaVersion', () => {
    expect(seedBookSchema.safeParse({ ...clone(validSeedBook), schemaVersion: 2 }).success).toBe(false);
  });

  it('rejects a book whose origin is not "seed"', () => {
    const bad = clone(validSeedBook);
    bad.book.origin = 'user';
    expect(seedBookSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a user-sourced mention in seed content', () => {
    const bad = clone(validSeedBook);
    bad.mentions[0].source = 'user';
    expect(seedBookSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a seed mention that is not published', () => {
    const bad = clone(validSeedBook);
    bad.mentions[0].status = 'personal';
    expect(seedBookSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a seed mention carrying a contributorRef', () => {
    const bad = clone(validSeedBook);
    (bad.mentions[0] as { contributorRef: string | null }).contributorRef = 'user-123';
    expect(seedBookSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects a mention whose bookId does not match the book', () => {
    const bad = clone(validSeedBook);
    bad.mentions[0].bookId = '00000000-0000-4000-8000-0000000000ff';
    const result = seedBookSchema.safeParse(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.join('.') === 'mentions.0.bookId')).toBe(true);
    }
  });
});
