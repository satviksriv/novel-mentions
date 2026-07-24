import { InMemoryLocalStore } from '@/data/local/in-memory-store';
import { SeedSource } from '@/data/seed/source';

import { BookRepository } from '../book-repository';

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

describe('BookRepository', () => {
  it('lists seed books before the reader\'s added books', async () => {
    const repo = new BookRepository(seed, new InMemoryLocalStore({ books: [USER_BOOK] }));
    const list = await repo.list();
    expect(list).toHaveLength(seed.books().length + 1);
    expect(list[0].id).toBe(seedBook.id);
    expect(list.at(-1)?.id).toBe(USER_BOOK.id);
  });

  it('resolves getById from seed and from local', async () => {
    const repo = new BookRepository(seed, new InMemoryLocalStore({ books: [USER_BOOK] }));
    expect((await repo.getById(seedBook.id))?.title).toBe(seedBook.title);
    expect((await repo.getById(USER_BOOK.id))?.origin).toBe('user');
    expect(await repo.getById('00000000-0000-4000-8000-0000000000ff')).toBeUndefined();
  });

  it('saveUserBook forces origin=user, persists, and upserts by id', async () => {
    const local = new InMemoryLocalStore();
    const repo = new BookRepository(seed, local);

    const saved = await repo.saveUserBook({ ...USER_BOOK, origin: 'seed' });
    expect(saved.origin).toBe('user');
    expect(await repo.getById(USER_BOOK.id)).toBeDefined();

    await repo.saveUserBook({ ...USER_BOOK, title: 'Renamed' });
    const books = await local.getUserBooks();
    expect(books).toHaveLength(1);
    expect(books[0].title).toBe('Renamed');
  });
});
