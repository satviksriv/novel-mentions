/**
 * UserNote — a reader's private, plain-text note. Always local, never published.
 * A note references its book always; `mentionId` is null for a whole-book note.
 * (The design handoff phrases this as "a mentionId or a bookId, never both" —
 * same intent; we keep bookId present since every note row shows book context.)
 */
import { z } from 'zod';

export const userNoteSchema = z.object({
  id: z.uuid(),
  bookId: z.uuid(),
  /** null ⇒ a note on the whole book. */
  mentionId: z.uuid().nullable().default(null),
  /** Plain text — no rich formatting ("Private to you · plain text"). */
  body: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type UserNote = z.infer<typeof userNoteSchema>;
