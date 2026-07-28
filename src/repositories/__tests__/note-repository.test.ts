import { InMemoryLocalStore } from '@/data/local/in-memory-store';

import { NoteRepository } from '../note-repository';
import { makeTestDeps } from './helpers';

const BOOK_ID = 'a0000000-0000-4000-8000-000000000001';
const MENTION_ID = 'a1000000-0000-4000-8000-000000000001';

function makeRepo() {
  const local = new InMemoryLocalStore();
  return { repo: new NoteRepository(local, makeTestDeps()), local };
}

describe('NoteRepository', () => {
  it('creates whole-book and mention-level notes and filters them', async () => {
    const { repo } = makeRepo();
    const bookNote = await repo.create({ bookId: BOOK_ID, body: 'A thought on the whole book' });
    const mentionNote = await repo.create({ bookId: BOOK_ID, mentionId: MENTION_ID, body: 'On this mention' });

    expect(bookNote.mentionId).toBeNull();
    expect(mentionNote.mentionId).toBe(MENTION_ID);

    expect(await repo.forBook(BOOK_ID)).toHaveLength(2);
    expect(await repo.bookLevelNotes(BOOK_ID)).toEqual([bookNote]);
    expect(await repo.forMention(MENTION_ID)).toEqual([mentionNote]);
  });

  it('stamps createdAt and updatedAt, and bumps updatedAt on edit', async () => {
    const { repo } = makeRepo();
    const note = await repo.create({ bookId: BOOK_ID, body: 'first' });
    expect(note.createdAt).toBe(note.updatedAt);

    const edited = await repo.update(note.id, 'second');
    expect(edited.body).toBe('second');
    expect(edited.createdAt).toBe(note.createdAt);
    expect(Date.parse(edited.updatedAt)).toBeGreaterThan(Date.parse(note.updatedAt));
  });

  it('throws when updating an unknown note', async () => {
    const { repo } = makeRepo();
    await expect(repo.update('00000000-0000-4000-8000-0000000000ff', 'x')).rejects.toThrow();
  });

  it('removes a note', async () => {
    const { repo, local } = makeRepo();
    const note = await repo.create({ bookId: BOOK_ID, body: 'delete me' });
    await repo.remove(note.id);
    expect(await local.getUserNotes()).toHaveLength(0);
  });

  it('removeForBook deletes whole-book and mention-level notes for that book only', async () => {
    const { repo, local } = makeRepo();
    const OTHER_BOOK = 'a0000000-0000-4000-8000-000000000002';
    await repo.create({ bookId: BOOK_ID, body: 'whole-book note' });
    await repo.create({ bookId: BOOK_ID, mentionId: MENTION_ID, body: 'mention note' });
    const keep = await repo.create({ bookId: OTHER_BOOK, body: 'note on another book' });

    await repo.removeForBook(BOOK_ID);

    expect((await local.getUserNotes()).map((n) => n.id)).toEqual([keep.id]);
  });

  it('rejects an empty note body', async () => {
    const { repo } = makeRepo();
    await expect(repo.create({ bookId: BOOK_ID, body: '' })).rejects.toThrow();
  });

  it('lists every note across books, newest-first', async () => {
    const { repo } = makeRepo();
    const OTHER_BOOK = 'a0000000-0000-4000-8000-000000000002';
    const first = await repo.create({ bookId: BOOK_ID, body: 'first' });
    const second = await repo.create({ bookId: OTHER_BOOK, mentionId: MENTION_ID, body: 'second' });

    const all = await repo.allUserNotes();
    // Sorted by createdAt descending — the test clock advances, so second is newer.
    expect(all.map((n) => n.id)).toEqual([second.id, first.id]);
  });

  it('returns an empty list when there are no notes', async () => {
    const { repo } = makeRepo();
    expect(await repo.allUserNotes()).toEqual([]);
  });
});
