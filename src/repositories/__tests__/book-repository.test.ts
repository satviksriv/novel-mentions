import { InMemoryLocalStore } from '@/data/local/in-memory-store';
import type { BookLookupResult, BookLookupSource } from '@/data/lookup/book-lookup-source';
import { SeedSource } from '@/data/seed/source';

import { BookRepository } from '../book-repository';
import { makeTestDeps } from './helpers';

const seed = new SeedSource();
const [seedBook] = seed.books();

const USER_BOOK = {
  id: 'd0000000-0000-4000-8000-000000000001',
  title: 'A Book I Added',
  author: 'Me',
  workType: 'memoir' as const,
  synopsis: '',
  coverRef: null,
  palette: seedBook.palette,
  origin: 'user' as const,
};

/** A lookup source that returns a fixed result set and records the last query. */
class FakeLookup implements BookLookupSource {
  lastQuery = '';
  constructor(private readonly results: BookLookupResult[] = []) {}
  async search(query: string): Promise<BookLookupResult[]> {
    this.lastQuery = query;
    return this.results;
  }
}

function makeRepo(local = new InMemoryLocalStore(), lookup: BookLookupSource = new FakeLookup()) {
  return new BookRepository(seed, local, lookup, makeTestDeps());
}

describe('BookRepository', () => {
  it('lists seed books before the reader\'s added books', async () => {
    const repo = makeRepo(new InMemoryLocalStore({ books: [USER_BOOK] }));
    const list = await repo.list();
    expect(list).toHaveLength(seed.books().length + 1);
    expect(list[0].id).toBe(seedBook.id);
    expect(list.at(-1)?.id).toBe(USER_BOOK.id);
  });

  it('resolves getById from seed and from local', async () => {
    const repo = makeRepo(new InMemoryLocalStore({ books: [USER_BOOK] }));
    expect((await repo.getById(seedBook.id))?.title).toBe(seedBook.title);
    expect((await repo.getById(USER_BOOK.id))?.origin).toBe('user');
    expect(await repo.getById('00000000-0000-4000-8000-0000000000ff')).toBeUndefined();
  });

  it('saveUserBook forces origin=user, persists, and upserts by id', async () => {
    const local = new InMemoryLocalStore();
    const repo = makeRepo(local);

    const saved = await repo.saveUserBook({ ...USER_BOOK, origin: 'seed' });
    expect(saved.origin).toBe('user');
    expect(await repo.getById(USER_BOOK.id)).toBeDefined();

    await repo.saveUserBook({ ...USER_BOOK, title: 'Renamed' });
    const books = await local.getUserBooks();
    expect(books).toHaveLength(1);
    expect(books[0].title).toBe('Renamed');
  });

  it('searchBooks delegates to the lookup source', async () => {
    const results: BookLookupResult[] = [
      { externalId: '/works/OL1W', title: 'Found', author: 'A. Writer', year: 1999, coverUrl: null },
    ];
    const lookup = new FakeLookup(results);
    const repo = makeRepo(new InMemoryLocalStore(), lookup);

    expect(await repo.searchBooks('  gatsby  ')).toEqual(results);
    expect(lookup.lastQuery).toBe('  gatsby  ');
  });

  it('addBook mints an id, derives a palette, forces origin=user, and persists', async () => {
    const local = new InMemoryLocalStore();
    const repo = makeRepo(local);

    const added = await repo.addBook({
      title: 'The Bell Jar',
      author: 'Sylvia Plath',
      workType: 'fiction',
      coverRef: 'https://covers.example/1.jpg',
    });

    expect(added.origin).toBe('user');
    expect(added.id).toMatch(/^c0000000-/); // deterministic test id
    expect(added.coverRef).toBe('https://covers.example/1.jpg');
    // A palette was derived (valid hex primary), not left empty.
    expect(added.palette.primary.light).toMatch(/^#[0-9a-f]{6}$/i);

    expect((await local.getUserBooks())).toHaveLength(1);
    expect((await repo.getById(added.id))?.title).toBe('The Bell Jar');
  });

  it('addBook rejects an invalid draft (empty title)', async () => {
    const repo = makeRepo();
    await expect(
      repo.addBook({ title: '', author: 'Nobody', workType: 'fiction' }),
    ).rejects.toThrow();
  });

  it('removeUserBook deletes a user book but rejects seed and unknown ids', async () => {
    const local = new InMemoryLocalStore({ books: [USER_BOOK] });
    const repo = makeRepo(local);

    await repo.removeUserBook(USER_BOOK.id);
    expect(await local.getUserBooks()).toHaveLength(0);
    expect(await repo.getById(USER_BOOK.id)).toBeUndefined();

    // Seed books are bundled, not user-added — not removable here.
    await expect(repo.removeUserBook(seedBook.id)).rejects.toThrow();
    await expect(repo.removeUserBook('00000000-0000-4000-8000-0000000000ff')).rejects.toThrow();
  });
});
