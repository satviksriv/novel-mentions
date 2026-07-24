/**
 * Domain enums — the canonical, app-wide vocabularies.
 *
 * Each is a zod schema first; the TypeScript type is inferred from it so there
 * is exactly one source of truth (no hand-written type drifting from its
 * validator). The theme layer re-exports `MentionKind` / `MentionStatus` from
 * here via tokens.ts, so colours stay keyed to the same values screens use.
 */
import { z } from 'zod';

/** Book category. Drives presentation — e.g. the context field reads "what the
 *  character was thinking" for fiction vs "the author" for autobiography/memoir. */
export const workTypeSchema = z.enum(['fiction', 'autobiography', 'memoir', 'nonFiction']);
export type WorkType = z.infer<typeof workTypeSchema>;

/** The six fixed mention kinds. `place` is a real 6th kind, not a relabel of `other`. */
export const mentionKindSchema = z.enum(['song', 'movie', 'quote', 'book', 'place', 'other']);
export type MentionKind = z.infer<typeof mentionKindSchema>;

/** Where a mention came from. `curated`/`ai` are seed content; `user` is logged in-app. */
export const mentionSourceSchema = z.enum(['curated', 'ai', 'user']);
export type MentionSource = z.infer<typeof mentionSourceSchema>;

/** Mention lifecycle state (see lifecycle.ts for the transition machine). */
export const mentionStatusSchema = z.enum(['personal', 'pendingReview', 'published', 'rejected']);
export type MentionStatus = z.infer<typeof mentionStatusSchema>;

/** How a book entered the library: bundled seed vs user-added. */
export const bookOriginSchema = z.enum(['seed', 'user']);
export type BookOrigin = z.infer<typeof bookOriginSchema>;
