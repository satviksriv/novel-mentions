import { SeedSource } from '@/data/seed/source';

describe('SeedSource', () => {
  const seed = new SeedSource();
  const [firstBook, secondBook] = seed.books();

  it('loads the two bundled books in order', () => {
    expect(seed.books()).toHaveLength(2);
    expect(firstBook.title).toBe('The Perks of Being a Wallflower');
    expect(secondBook.title).toBe('The Great Gatsby');
  });

  it('looks a book up by id, undefined when unknown', () => {
    expect(seed.bookById(firstBook.id)?.title).toBe(firstBook.title);
    expect(seed.bookById('00000000-0000-4000-8000-0000000000ff')).toBeUndefined();
  });

  it('returns a book\'s published mentions, all pointing at that book', () => {
    const mentions = seed.mentionsForBook(secondBook.id);
    expect(mentions.length).toBeGreaterThanOrEqual(8);
    expect(mentions.every((m) => m.bookId === secondBook.id)).toBe(true);
    expect(mentions.every((m) => m.status === 'published')).toBe(true);
  });

  it('returns [] for a book it does not have', () => {
    expect(seed.mentionsForBook('00000000-0000-4000-8000-0000000000ff')).toEqual([]);
  });

  it('finds a single mention across books, undefined when unknown', () => {
    const someMention = seed.mentionsForBook(firstBook.id)[0];
    expect(seed.mentionById(someMention.id)?.id).toBe(someMention.id);
    expect(seed.mentionById('00000000-0000-4000-8000-0000000000ff')).toBeUndefined();
  });

  it('does not leak internal state through the returned array', () => {
    const mentions = seed.mentionsForBook(secondBook.id);
    mentions.pop();
    expect(seed.mentionsForBook(secondBook.id).length).toBeGreaterThan(mentions.length);
  });
});
