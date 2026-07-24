/**
 * RemoteContentSource — the Phase-2 backend seam, defined now and stubbed.
 *
 * In the MVP there is no backend: published content ships as bundled seed and
 * user writes live in the local store. This interface exists from day one so
 * repositories can be wired against it without change when Phase 2 implements a
 * real backend (candidate: Supabase). `NoopRemoteContentSource` is the MVP impl:
 * nothing to fetch, and "submit for review" only flips local status.
 */
import type { Book, Mention } from '@/domain';

export interface RemoteContentSource {
  /** Published books from the backend. Empty in MVP. */
  fetchBooks(): Promise<Book[]>;
  /** Published mentions for a book from the backend. Empty in MVP. */
  fetchMentions(bookId: string): Promise<Mention[]>;
  /** Enqueue a personal mention for review. A no-op locally in MVP. */
  submitMention(mention: Mention): Promise<void>;
}

/** MVP stub: no remote content, and submit is a local-only status flip. */
export class NoopRemoteContentSource implements RemoteContentSource {
  async fetchBooks(): Promise<Book[]> {
    return [];
  }

  async fetchMentions(_bookId: string): Promise<Mention[]> {
    return [];
  }

  async submitMention(_mention: Mention): Promise<void> {
    // Phase 2: POST to the review queue. Local status flip is enough for MVP.
  }
}
