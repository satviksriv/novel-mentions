/**
 * NoteRepository — CRUD for the reader's private notes. A note always carries
 * its `bookId`; `mentionId` is null for a whole-book note and set for a note on
 * a specific mention (see UserNote). Notes are local-only and never published.
 */
import { parseUserNote, type UserNote } from '@/domain';
import type { LocalStore } from '@/data/local/local-store';

import type { RepoDeps } from './deps';

/** The fields a caller supplies to create a note. */
export interface DraftNote {
  bookId: string;
  /** null / omitted ⇒ a note on the whole book. */
  mentionId?: string | null;
  body: string;
}

export class NoteRepository {
  constructor(
    private readonly local: LocalStore,
    private readonly deps: RepoDeps,
  ) {}

  /** All notes for a book — both whole-book and mention-level. */
  async forBook(bookId: string): Promise<UserNote[]> {
    const notes = await this.local.getUserNotes();
    return notes.filter((n) => n.bookId === bookId);
  }

  /** Whole-book notes only (mentionId null). */
  async bookLevelNotes(bookId: string): Promise<UserNote[]> {
    const notes = await this.local.getUserNotes();
    return notes.filter((n) => n.bookId === bookId && n.mentionId === null);
  }

  /** Notes attached to a specific mention. */
  async forMention(mentionId: string): Promise<UserNote[]> {
    const notes = await this.local.getUserNotes();
    return notes.filter((n) => n.mentionId === mentionId);
  }

  /**
   * Every note the reader has written, across all books, newest-first — the
   * read path for the My stuff "My notes" tab (which joins each to its book and,
   * for mention-level notes, its mention).
   */
  async allUserNotes(): Promise<UserNote[]> {
    const notes = await this.local.getUserNotes();
    return [...notes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async create(draft: DraftNote): Promise<UserNote> {
    const now = this.deps.now();
    const record = parseUserNote({
      id: this.deps.newId(),
      bookId: draft.bookId,
      mentionId: draft.mentionId ?? null,
      body: draft.body,
      createdAt: now,
      updatedAt: now,
    });
    const notes = await this.local.getUserNotes();
    await this.local.saveUserNotes([...notes, record]);
    return record;
  }

  /** Replace a note's body, bumping updatedAt. Throws if the note is unknown. */
  async update(id: string, body: string): Promise<UserNote> {
    const notes = await this.local.getUserNotes();
    const existing = notes.find((n) => n.id === id);
    if (!existing) throw new Error(`Note "${id}" not found`);
    const updated = parseUserNote({ ...existing, body, updatedAt: this.deps.now() });
    await this.local.saveUserNotes(notes.map((n) => (n.id === id ? updated : n)));
    return updated;
  }

  async remove(id: string): Promise<void> {
    const notes = await this.local.getUserNotes();
    await this.local.saveUserNotes(notes.filter((n) => n.id !== id));
  }
}
