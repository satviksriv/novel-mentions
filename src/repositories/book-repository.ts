/**
 * BookRepository — the library, merging bundled seed books with the reader's
 * own added books. The UI never sees which store a book came from beyond its
 * `origin` field (seed vs user). The add-a-book *flow* is issue #12; this
 * repository provides the merge/read path and a persistence hook for it.
 */
import { deriveBookPalette, parseBook, type Book, type WorkType } from '@/domain';
import type { LocalStore } from '@/data/local/local-store';
import type { BookLookupResult, BookLookupSource } from '@/data/lookup/book-lookup-source';
import type { SeedSource } from '@/data/seed/source';

import type { RepoDeps } from './deps';

/** The authoring fields for a user-added book; id, palette and origin are filled by addBook(). */
export interface AddBookDraft {
  title: string;
  author: string;
  workType: WorkType;
  /** Remote cover URL (or asset ref); null when the book has no cover. */
  coverRef?: string | null;
  synopsis?: string;
}

export class BookRepository {
  constructor(
    private readonly seed: SeedSource,
    private readonly local: LocalStore,
    private readonly lookup: BookLookupSource,
    private readonly deps: RepoDeps,
  ) {}

  /** Seed books first (bundled order), then the reader's added books. */
  async list(): Promise<Book[]> {
    const userBooks = await this.local.getUserBooks();
    return [...this.seed.books(), ...userBooks];
  }

  async getById(id: string): Promise<Book | undefined> {
    const seedBook = this.seed.bookById(id);
    if (seedBook) return seedBook;
    const userBooks = await this.local.getUserBooks();
    return userBooks.find((b) => b.id === id);
  }

  /**
   * Search the public books provider (Open Library in MVP) for the add-a-book
   * flow. Blank query ⇒ no results; network/HTTP errors propagate to the caller
   * to render. The UI goes through here rather than the data source directly.
   */
  async searchBooks(query: string, opts?: { signal?: AbortSignal }): Promise<BookLookupResult[]> {
    return this.lookup.search(query, opts);
  }

  /**
   * Add a book to the reader's local library (#12). Mints the id, derives a
   * deterministic per-book palette from the title+author (cover-pixel
   * derivation isn't Expo Go-safe — see deriveBookPalette), forces
   * `origin: 'user'`, validates, and persists. Community publishing is Phase 2.
   */
  async addBook(draft: AddBookDraft): Promise<Book> {
    const record = parseBook({
      id: this.deps.newId(),
      title: draft.title,
      author: draft.author,
      workType: draft.workType,
      synopsis: draft.synopsis ?? '',
      coverRef: draft.coverRef ?? null,
      palette: deriveBookPalette(`${draft.title}|${draft.author}`),
      origin: 'user',
    });
    const books = await this.local.getUserBooks();
    await this.local.saveUserBooks([...books, record]);
    return record;
  }

  /**
   * Remove a user-added book from the local library (#34). Owns only the book
   * record; the cascade of the reader's mentions and notes for it is coordinated
   * in removeUserBookCascade. Seed books are bundled and not removable — an
   * unknown id (which includes any seed book) throws rather than silently no-op.
   */
  async removeUserBook(bookId: string): Promise<void> {
    const books = await this.local.getUserBooks();
    if (!books.some((b) => b.id === bookId)) {
      throw new Error(`Book "${bookId}" is not a user-added book (cannot remove)`);
    }
    await this.local.saveUserBooks(books.filter((b) => b.id !== bookId));
  }

  /**
   * Persist a full user-added book (origin forced to `user`), upserting by id.
   * Lower-level than addBook (caller supplies id + palette); retained for tests
   * and any direct write path.
   */
  async saveUserBook(book: Book): Promise<Book> {
    const record = parseBook({ ...book, origin: 'user' });
    const books = await this.local.getUserBooks();
    const next = books.filter((b) => b.id !== record.id);
    next.push(record);
    await this.local.saveUserBooks(next);
    return record;
  }
}
