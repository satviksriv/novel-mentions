/**
 * SeedSource — reads the bundled seed assets as validated domain records.
 *
 * The two curated books (issue #5) ship as JSON bundled by Metro. Each asset is
 * parsed through the domain `seedBookSchema` once at construction, so an invalid
 * asset fails loudly at startup rather than surfacing as a half-broken screen.
 * This is the "seed" data source in the architecture; repositories merge its
 * published content with the user's local writes.
 */
import { parseSeedBook, type Book, type Mention, type SeedBook } from '@/domain';

import gatsby from './gatsby.seed.json';
import perks from './perks.seed.json';

/** The bundled assets, in library display order. */
const BUNDLED_SEED_ASSETS: readonly unknown[] = [perks, gatsby];

export class SeedSource {
  private readonly docs: readonly SeedBook[];

  constructor(assets: readonly unknown[] = BUNDLED_SEED_ASSETS) {
    this.docs = assets.map(parseSeedBook);
  }

  /** All seed books, in bundled order. */
  books(): Book[] {
    return this.docs.map((d) => d.book);
  }

  bookById(id: string): Book | undefined {
    return this.docs.find((d) => d.book.id === id)?.book;
  }

  /** Published seed mentions for one book (empty if the book isn't seeded). */
  mentionsForBook(bookId: string): Mention[] {
    const doc = this.docs.find((d) => d.book.id === bookId);
    return doc ? [...doc.mentions] : [];
  }

  /** A single mention across all seed books, or undefined. */
  mentionById(id: string): Mention | undefined {
    for (const doc of this.docs) {
      const found = doc.mentions.find((m) => m.id === id);
      if (found) return found;
    }
    return undefined;
  }
}
