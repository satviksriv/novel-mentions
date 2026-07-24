/**
 * Valid sample records used across the domain tests. Field types are left wide
 * (no `as const`) so negative tests can clone a fixture and poke an invalid
 * value into it. Each fixture is the *input* shape — tests parse it and assert
 * on the result, or mutate a clone to exercise a specific failure.
 */
export const BOOK_ID = '00000000-0000-4000-8000-000000000001';
export const MENTION_ID = '00000000-0000-4000-8000-000000000002';
export const NOTE_ID = '00000000-0000-4000-8000-000000000004';
export const ISO = '2026-07-24T10:00:00.000Z';

export const validPalette = {
  primary: { light: '#1E8A5A', dark: '#1E8A5A' },
  softTint: { light: '#DEF0E7', dark: '#0F3324' },
  coverGradient: ['#2AA96E', '#0E6E44'],
};

export const validBook = {
  id: BOOK_ID,
  title: 'The Great Gatsby',
  author: 'F. Scott Fitzgerald',
  workType: 'fiction',
  synopsis: 'A Jazz-Age tragedy on Long Island.',
  coverRef: null,
  palette: validPalette,
  origin: 'seed',
};

export const validMention = {
  id: MENTION_ID,
  bookId: BOOK_ID,
  kind: 'place',
  title: 'Valley of Ashes',
  attribution: 'Place · Long Island, NY',
  chapter: 'Chapter 2',
  chapterOrder: 2,
  positionHint: null,
  pageHint: { page: 23, edition: 'Scribner, 2004' },
  excerpt: 'a fantastic farm where ashes grow like wheat',
  whyMentioned: 'The moral wasteland between West Egg and the city.',
  characterContext: 'Nick is unsettled by the desolation.',
  contextSubject: 'Nick Carraway',
  source: 'curated',
  contributorRef: null,
  externalUrl: null,
  status: 'published',
  rejectionReason: null,
};

export const validNote = {
  id: NOTE_ID,
  bookId: BOOK_ID,
  mentionId: MENTION_ID,
  body: 'This image stuck with me.',
  createdAt: ISO,
  updatedAt: ISO,
};

export const validSeedBook = {
  schemaVersion: 1,
  book: validBook,
  mentions: [validMention],
};

/** A deep clone so a test can mutate one field without touching the shared fixture. */
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
