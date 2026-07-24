import { bookSchema } from '../book';
import { clone, validBook } from './fixtures';

describe('Book schema', () => {
  it('parses a valid book', () => {
    const book = bookSchema.parse(validBook);
    expect(book.title).toBe('The Great Gatsby');
    expect(book.origin).toBe('seed');
  });

  it('applies defaults for omitted optional fields', () => {
    const { synopsis, coverRef, ...rest } = clone(validBook);
    void synopsis;
    void coverRef;
    const book = bookSchema.parse(rest);
    expect(book.synopsis).toBe('');
    expect(book.coverRef).toBeNull();
  });

  it('rejects a non-UUID id', () => {
    const bad = { ...clone(validBook), id: 'book-1' };
    expect(bookSchema.safeParse(bad).success).toBe(false);
  });

  it('rejects an empty title or author', () => {
    expect(bookSchema.safeParse({ ...clone(validBook), title: '' }).success).toBe(false);
    expect(bookSchema.safeParse({ ...clone(validBook), author: '' }).success).toBe(false);
  });

  it('rejects an unknown workType', () => {
    expect(bookSchema.safeParse({ ...clone(validBook), workType: 'poetry' }).success).toBe(false);
  });

  it('rejects a malformed palette', () => {
    const bad = clone(validBook);
    bad.palette.primary.light = 'green';
    expect(bookSchema.safeParse(bad).success).toBe(false);
  });
});
