import { userNoteSchema } from '../note';
import { clone, validNote } from './fixtures';

describe('UserNote schema', () => {
  it('parses a valid note attached to a mention', () => {
    const note = userNoteSchema.parse(validNote);
    expect(note.mentionId).toBe(validNote.mentionId);
  });

  it('treats a note with no mentionId as a whole-book note (null)', () => {
    const { mentionId, ...rest } = clone(validNote);
    void mentionId;
    const note = userNoteSchema.parse(rest);
    expect(note.mentionId).toBeNull();
  });

  it('rejects an empty body', () => {
    expect(userNoteSchema.safeParse({ ...clone(validNote), body: '' }).success).toBe(false);
  });

  it('rejects non-ISO timestamps', () => {
    expect(userNoteSchema.safeParse({ ...clone(validNote), createdAt: '2026-07-24' }).success).toBe(false);
    expect(userNoteSchema.safeParse({ ...clone(validNote), updatedAt: 'yesterday' }).success).toBe(false);
  });

  it('rejects a non-UUID bookId', () => {
    expect(userNoteSchema.safeParse({ ...clone(validNote), bookId: 'book' }).success).toBe(false);
  });
});
