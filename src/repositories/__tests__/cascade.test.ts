import { InMemoryLocalStore } from '@/data/local/in-memory-store';
import type { BookLookupSource } from '@/data/lookup/book-lookup-source';
import { SeedSource } from '@/data/seed/source';

import { BookRepository } from '../book-repository';
import { removeUserBookCascade } from '../cascade';
import { MentionRepository } from '../mention-repository';
import { NoteRepository } from '../note-repository';
import { draftFor, makeTestDeps, RecordingRemote } from './helpers';

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

/** BookRepository needs a lookup source, but the cascade never searches. */
const noLookup: BookLookupSource = { search: async () => [] };

function makeRepos() {
  const local = new InMemoryLocalStore({ books: [USER_BOOK] });
  const deps = makeTestDeps();
  const repos = {
    books: new BookRepository(seed, local, noLookup, deps),
    mentions: new MentionRepository(seed, local, new RecordingRemote(), deps),
    notes: new NoteRepository(local, deps),
  };
  return { repos, local };
}

describe('removeUserBookCascade (#34)', () => {
  it('deletes the user book and its mentions/notes, sparing other books', async () => {
    const { repos, local } = makeRepos();

    // The reader's own content on the user-added book…
    await repos.mentions.create(draftFor(USER_BOOK.id, { title: 'on my book' }));
    await repos.notes.create({ bookId: USER_BOOK.id, body: 'a note on my book' });
    await repos.notes.create({ bookId: USER_BOOK.id, mentionId: null, body: 'another note' });
    // …and content on a seed book, which must survive.
    const keepMention = await repos.mentions.create(draftFor(seedBook.id, { title: 'on gatsby' }));
    const keepNote = await repos.notes.create({ bookId: seedBook.id, body: 'a note on gatsby' });

    await removeUserBookCascade(repos, USER_BOOK.id);

    expect(await local.getUserBooks()).toHaveLength(0);
    expect((await local.getUserMentions()).map((m) => m.id)).toEqual([keepMention.id]);
    expect((await local.getUserNotes()).map((n) => n.id)).toEqual([keepNote.id]);
  });

  it('refuses a seed book id and deletes nothing — the guard runs before any removal', async () => {
    const { repos, local } = makeRepos();
    // The reader has mentions and notes on the seed book; a wrong id must not wipe them.
    const mention = await repos.mentions.create(draftFor(seedBook.id, { title: 'keep me' }));
    const note = await repos.notes.create({ bookId: seedBook.id, body: 'keep me too' });

    await expect(removeUserBookCascade(repos, seedBook.id)).rejects.toThrow();

    expect(await local.getUserBooks()).toHaveLength(1);
    expect((await local.getUserMentions()).map((m) => m.id)).toEqual([mention.id]);
    expect((await local.getUserNotes()).map((n) => n.id)).toEqual([note.id]);
  });

  it('refuses an unknown book id', async () => {
    const { repos } = makeRepos();
    await expect(
      removeUserBookCascade(repos, '00000000-0000-4000-8000-0000000000ff'),
    ).rejects.toThrow();
  });
});
