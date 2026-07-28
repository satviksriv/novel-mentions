/**
 * Cross-repository coordination that no single repository owns. Each repository
 * still owns writes to its own collection; this module only sequences them.
 */
import type { BookRepository } from './book-repository';
import type { MentionRepository } from './mention-repository';
import type { NoteRepository } from './note-repository';

/** The repositories a cascade touches — a subset of the full Repositories bag. */
export interface CascadeRepos {
  books: BookRepository;
  mentions: MentionRepository;
  notes: NoteRepository;
}

/**
 * Remove a user-added book and cascade-delete the reader's own local content for
 * it — their mentions and notes (#34).
 *
 * Guard runs first (read-only): only `origin: 'user'` books cascade, so a seed
 * or unknown id throws *before* any deletion — a wrong id can never wipe the
 * reader's mentions/notes on a seed book. Then children are deleted, and the
 * book record last, so if a step fails the book stays and the whole thing is
 * retryable (the local store has no transactions).
 *
 * Why full local deletion is correct in the MVP: a user-added book is local-only
 * (in no shared catalog), and a user mention can't reach `published` without the
 * Phase-2 reviewer — so nothing here was ever visible to another reader. The
 * smarter unsubscribe-vs-delete semantics land with the backend (#35).
 */
export async function removeUserBookCascade(repos: CascadeRepos, bookId: string): Promise<void> {
  const book = await repos.books.getById(bookId);
  if (!book || book.origin !== 'user') {
    throw new Error(`Book "${bookId}" is not a user-added book (cannot remove)`);
  }
  await repos.mentions.removeForBook(bookId);
  await repos.notes.removeForBook(bookId);
  await repos.books.removeUserBook(bookId);
}
