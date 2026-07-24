import {
  bookOriginSchema,
  mentionKindSchema,
  mentionSourceSchema,
  mentionStatusSchema,
  workTypeSchema,
} from '../enums';

describe('domain enums', () => {
  it('expose exactly the expected options', () => {
    expect(workTypeSchema.options).toEqual(['fiction', 'autobiography', 'memoir', 'nonFiction']);
    expect(mentionKindSchema.options).toEqual(['song', 'movie', 'quote', 'book', 'place', 'other']);
    expect(mentionSourceSchema.options).toEqual(['curated', 'ai', 'user']);
    expect(mentionStatusSchema.options).toEqual(['personal', 'pendingReview', 'published', 'rejected']);
    expect(bookOriginSchema.options).toEqual(['seed', 'user']);
  });

  it('reject values outside the vocabulary', () => {
    expect(mentionKindSchema.safeParse('podcast').success).toBe(false);
    expect(mentionStatusSchema.safeParse('draft').success).toBe(false);
    expect(workTypeSchema.safeParse('poetry').success).toBe(false);
  });

  it('accept every declared option', () => {
    for (const kind of mentionKindSchema.options) {
      expect(mentionKindSchema.safeParse(kind).success).toBe(true);
    }
  });
});
