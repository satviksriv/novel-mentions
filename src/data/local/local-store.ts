/**
 * LocalStore — the persistence seam for the user's private writes.
 *
 * User-logged mentions, private notes, and user-added books all live here,
 * local-first. The interface is deliberately a small collection get/save API:
 * repositories own the domain logic (merge, lifecycle, id/timestamp minting)
 * and treat the store as dumb persistence. That keeps repositories pure and
 * unit-testable against an in-memory implementation, while the app is backed by
 * AsyncStorage — swappable to SQLite in Phase 2 without touching repositories.
 *
 * Records handed in are already-validated domain objects; implementations must
 * not alias caller state (return/hold copies) so a mutation can't leak across.
 */
import type { Book, Mention, UserNote } from '@/domain';

export interface LocalStore {
  getUserMentions(): Promise<Mention[]>;
  saveUserMentions(mentions: readonly Mention[]): Promise<void>;

  getUserNotes(): Promise<UserNote[]>;
  saveUserNotes(notes: readonly UserNote[]): Promise<void>;

  getUserBooks(): Promise<Book[]>;
  saveUserBooks(books: readonly Book[]): Promise<void>;
}
