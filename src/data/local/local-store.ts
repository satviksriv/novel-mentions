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

/**
 * One-shot UI cues, tracked so they're shown once and then never again
 * (onboarding handoff O1/O3). Not domain content — pure client state, which is
 * why these live beside the collections rather than in `@/domain`.
 */
export const UI_FLAGS = ['welcomeSeen', 'libraryTipSeen', 'fabTipSeen'] as const;

export type UiFlag = (typeof UI_FLAGS)[number];

/** Every flag, defaulted to false — an unseen cue and a missing key are the same thing. */
export type UiFlags = Record<UiFlag, boolean>;

export const NO_FLAGS_SEEN: UiFlags = {
  welcomeSeen: false,
  libraryTipSeen: false,
  fabTipSeen: false,
};

export interface LocalStore {
  getUserMentions(): Promise<Mention[]>;
  saveUserMentions(mentions: readonly Mention[]): Promise<void>;

  getUserNotes(): Promise<UserNote[]>;
  saveUserNotes(notes: readonly UserNote[]): Promise<void>;

  getUserBooks(): Promise<Book[]>;
  saveUserBooks(books: readonly Book[]): Promise<void>;

  getUiFlags(): Promise<UiFlags>;
  saveUiFlags(flags: UiFlags): Promise<void>;
}
