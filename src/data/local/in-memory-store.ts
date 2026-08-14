/**
 * InMemoryLocalStore — a LocalStore that keeps everything in memory.
 *
 * Used by the repository unit tests (no native modules, no async I/O flakiness)
 * and handy as a default when no persistence is wired. Reads and writes deep-
 * clone so callers can never mutate stored state by holding a reference — the
 * same isolation guarantee the AsyncStorage impl gets for free via JSON.
 */
import type { Book, Mention, UserNote } from '@/domain';

import { NO_FLAGS_SEEN, type LocalStore, type UiFlags } from './local-store';

const clone = <T>(value: readonly T[]): T[] => value.map((v) => ({ ...v }));

export interface InitialLocalData {
  mentions?: readonly Mention[];
  notes?: readonly UserNote[];
  books?: readonly Book[];
  /** Defaults to every cue unseen — i.e. a fresh install. */
  uiFlags?: Partial<UiFlags>;
}

export class InMemoryLocalStore implements LocalStore {
  private mentions: Mention[];
  private notes: UserNote[];
  private books: Book[];
  private uiFlags: UiFlags;

  constructor(initial: InitialLocalData = {}) {
    this.mentions = clone(initial.mentions ?? []);
    this.notes = clone(initial.notes ?? []);
    this.books = clone(initial.books ?? []);
    this.uiFlags = { ...NO_FLAGS_SEEN, ...initial.uiFlags };
  }

  async getUserMentions(): Promise<Mention[]> {
    return clone(this.mentions);
  }

  async saveUserMentions(mentions: readonly Mention[]): Promise<void> {
    this.mentions = clone(mentions);
  }

  async getUserNotes(): Promise<UserNote[]> {
    return clone(this.notes);
  }

  async saveUserNotes(notes: readonly UserNote[]): Promise<void> {
    this.notes = clone(notes);
  }

  async getUserBooks(): Promise<Book[]> {
    return clone(this.books);
  }

  async saveUserBooks(books: readonly Book[]): Promise<void> {
    this.books = clone(books);
  }

  async getUiFlags(): Promise<UiFlags> {
    return { ...this.uiFlags };
  }

  async saveUiFlags(flags: UiFlags): Promise<void> {
    this.uiFlags = { ...flags };
  }
}
