/**
 * BookRepository — the library, merging bundled seed books with the reader's
 * own added books. The UI never sees which store a book came from beyond its
 * `origin` field (seed vs user). The add-a-book *flow* is issue #12; this
 * repository provides the merge/read path and a persistence hook for it.
 */
import { parseBook, type Book } from '@/domain';
import type { LocalStore } from '@/data/local/local-store';
import type { SeedSource } from '@/data/seed/source';

export class BookRepository {
  constructor(
    private readonly seed: SeedSource,
    private readonly local: LocalStore,
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
   * Persist a user-added book (origin forced to `user`). Validates before
   * writing. Used by the add-a-book flow (#12); here so merge reads have a
   * write path to exercise.
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
