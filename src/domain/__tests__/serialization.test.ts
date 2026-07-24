import {
  formatIssues,
  parseSeedBook,
  parseSeedBookJson,
  safeParseSeedBook,
  serializeMention,
  serializeSeedBook,
} from '../serialization';
import { clone, validMention, validSeedBook } from './fixtures';

describe('serialization', () => {
  it('round-trips a seed book: parse(serialize(parse(x))) is stable', () => {
    const parsed = parseSeedBook(validSeedBook);
    const json = serializeSeedBook(parsed);
    expect(parseSeedBook(JSON.parse(json))).toEqual(parsed);
  });

  it('parses a seed book straight from JSON text', () => {
    const seed = parseSeedBookJson(JSON.stringify(validSeedBook));
    expect(seed.book.title).toBe('The Great Gatsby');
  });

  it('serialize validates first and throws on an invalid record', () => {
    const bad = { ...clone(validMention), whyMentioned: '' };
    expect(() => serializeMention(bad as never)).toThrow();
  });

  it('safeParse returns a structured error for invalid input', () => {
    const bad = clone(validSeedBook);
    bad.mentions[0].status = 'personal';
    const result = safeParseSeedBook(bad);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('formatIssues renders readable "path: message" lines', () => {
    const result = safeParseSeedBook({ schemaVersion: 1, book: {}, mentions: [] });
    expect(result.success).toBe(false);
    if (!result.success) {
      const text = formatIssues(result.error);
      expect(text).toContain('book.');
      expect(text.split('\n').length).toBeGreaterThan(0);
    }
  });
});
