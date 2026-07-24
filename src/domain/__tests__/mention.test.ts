import { EXCERPT_MAX_LENGTH, mentionSchema } from '../mention';
import { BOOK_ID, MENTION_ID, clone, validMention } from './fixtures';

describe('Mention schema', () => {
  it('parses a valid mention', () => {
    const m = mentionSchema.parse(validMention);
    expect(m.kind).toBe('place');
    expect(m.pageHint).toEqual({ page: 23, edition: 'Scribner, 2004' });
  });

  it('applies null defaults for omitted optional fields', () => {
    const minimal = {
      id: MENTION_ID,
      bookId: BOOK_ID,
      kind: 'song' as const,
      title: 'Ain’t We Got Fun',
      chapter: 'Chapter 5',
      whyMentioned: 'Playing as Gatsby and Daisy reunite.',
      source: 'curated' as const,
      status: 'published' as const,
    };
    const m = mentionSchema.parse(minimal);
    expect(m.attribution).toBeNull();
    expect(m.chapterOrder).toBeNull();
    expect(m.positionHint).toBeNull();
    expect(m.pageHint).toBeNull();
    expect(m.excerpt).toBeNull();
    expect(m.characterContext).toBeNull();
    expect(m.contextSubject).toBeNull();
    expect(m.contributorRef).toBeNull();
    expect(m.externalUrl).toBeNull();
    expect(m.rejectionReason).toBeNull();
  });

  it('requires a non-empty whyMentioned', () => {
    expect(mentionSchema.safeParse({ ...clone(validMention), whyMentioned: '' }).success).toBe(false);
  });

  it('rejects an excerpt longer than the fair-use cap', () => {
    const tooLong = { ...clone(validMention), excerpt: 'x'.repeat(EXCERPT_MAX_LENGTH + 1) };
    expect(mentionSchema.safeParse(tooLong).success).toBe(false);
    const atCap = { ...clone(validMention), excerpt: 'x'.repeat(EXCERPT_MAX_LENGTH) };
    expect(mentionSchema.safeParse(atCap).success).toBe(true);
  });

  it('requires an edition alongside a page (no bare page numbers)', () => {
    const bad = { ...clone(validMention), pageHint: { page: 23 } };
    expect(mentionSchema.safeParse(bad).success).toBe(false);
  });

  it('validates externalUrl as a URL when present', () => {
    expect(mentionSchema.safeParse({ ...clone(validMention), externalUrl: 'not a url' }).success).toBe(false);
    expect(
      mentionSchema.safeParse({ ...clone(validMention), externalUrl: 'https://example.com/x' }).success,
    ).toBe(true);
  });

  it('rejects an unknown kind or status', () => {
    expect(mentionSchema.safeParse({ ...clone(validMention), kind: 'tvshow' }).success).toBe(false);
    expect(mentionSchema.safeParse({ ...clone(validMention), status: 'archived' }).success).toBe(false);
  });
});
