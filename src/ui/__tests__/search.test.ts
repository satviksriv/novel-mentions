import type { Book, Mention } from '@/domain';

import { searchLibrary } from '../search';

let seq = 0;

function mkBook(over: Partial<Book> & { title: string; author: string }): Book {
  seq += 1;
  return {
    id: `b0000000-0000-4000-8000-${String(seq).padStart(12, '0')}`,
    workType: 'fiction',
    synopsis: '',
    coverRef: null,
    palette: {
      primary: { light: '#000', dark: '#000' },
      softTint: { light: '#eee', dark: '#111' },
      coverGradient: ['#000', '#111'],
    },
    origin: 'seed',
    ...over,
  };
}

function mkMention(over: Partial<Mention> & { title: string }): Mention {
  seq += 1;
  return {
    id: `a0000000-0000-4000-8000-${String(seq).padStart(12, '0')}`,
    bookId: 'b0000000-0000-4000-8000-000000000001',
    kind: 'song',
    attribution: null,
    chapter: 'Chapter 1',
    chapterOrder: null,
    positionHint: null,
    pageHint: null,
    excerpt: null,
    whyMentioned: 'why',
    characterContext: null,
    contextSubject: null,
    source: 'curated',
    contributorRef: null,
    externalUrl: null,
    status: 'published',
    rejectionReason: null,
    ...over,
  };
}

const gatsby = mkBook({ title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' });
const perks = mkBook({ title: 'The Perks of Being a Wallflower', author: 'Stephen Chbosky' });
const books = [gatsby, perks];

const valley = mkMention({ title: 'The Valley of Ashes', attribution: 'Place · Queens, New York' });
const loveNest = mkMention({ title: 'The Love Nest', attribution: 'Song · Louis A. Hirsch & Otto Harbach' });
const asleep = mkMention({ title: 'Asleep', attribution: 'Song · The Smiths' });
const mentions = [valley, loveNest, asleep];

describe('searchLibrary', () => {
  it('returns nothing for a blank or whitespace-only query', () => {
    expect(searchLibrary(books, mentions, '')).toEqual({ books: [], mentions: [] });
    expect(searchLibrary(books, mentions, '   ')).toEqual({ books: [], mentions: [] });
  });

  it('matches books on title, case-insensitively', () => {
    const r = searchLibrary(books, mentions, 'gatsby');
    expect(r.books).toEqual([gatsby]);
  });

  it('matches books on author', () => {
    const r = searchLibrary(books, mentions, 'chbosky');
    expect(r.books).toEqual([perks]);
  });

  it('matches mentions on title', () => {
    const r = searchLibrary(books, mentions, 'valley');
    expect(r.mentions).toEqual([valley]);
  });

  it('matches mentions on attribution', () => {
    const r = searchLibrary(books, mentions, 'smiths');
    expect(r.mentions).toEqual([asleep]);
  });

  it('requires every token to match (AND across the haystack)', () => {
    expect(searchLibrary(books, mentions, 'love nest').mentions).toEqual([loveNest]);
    expect(searchLibrary(books, mentions, 'love smiths').mentions).toEqual([]);
  });

  it('preserves input order within each group', () => {
    // "the" is in both book titles, both "The …" mention titles, and asleep's
    // "The Smiths" attribution — so every item matches; assert original order.
    const r = searchLibrary(books, mentions, 'the');
    expect(r.books).toEqual([gatsby, perks]);
    expect(r.mentions).toEqual([valley, loveNest, asleep]);
  });

  it('can return matches in both groups at once', () => {
    const r = searchLibrary(books, mentions, 'song');
    expect(r.books).toEqual([]);
    expect(r.mentions).toEqual([loveNest, asleep]);
  });
});
