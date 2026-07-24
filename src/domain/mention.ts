/**
 * Mention — the heart of the app: a cultural reference an author makes, with
 * where it appears, what it is, why it's there, and what the character/author
 * was feeling. Same shape whether it's seed content or a user's own log.
 */
import { z } from 'zod';

import { mentionKindSchema, mentionSourceSchema, mentionStatusSchema } from './enums';

/**
 * Edition-qualified page hint. Page numbers differ across editions, so a page
 * is only ever meaningful alongside its edition — the two are stored together
 * and never as a bare page number. Chapter (on the mention) is canonical.
 */
export const pageHintSchema = z.object({
  page: z.union([z.number().int().positive(), z.string().min(1)]),
  edition: z.string().min(1),
});
export type PageHint = z.infer<typeof pageHintSchema>;

/** Excerpts are fair-use commentary — a sentence or two, never long passages. */
export const EXCERPT_MAX_LENGTH = 400;

export const mentionSchema = z.object({
  id: z.uuid(),
  bookId: z.uuid(),
  kind: mentionKindSchema,
  title: z.string().min(1),
  /** Artist / director / speaker; for places e.g. "Place · Long Island, NY". */
  attribution: z.string().nullable().default(null),

  // --- Where ---
  /** Canonical locator. */
  chapter: z.string().min(1),
  /** Reading-order key for grouping, so chapter labels never need parsing. */
  chapterOrder: z.number().int().nonnegative().nullable().default(null),
  positionHint: z.string().nullable().default(null),
  pageHint: pageHintSchema.nullable().default(null),

  // --- Substance ---
  excerpt: z.string().max(EXCERPT_MAX_LENGTH).nullable().default(null),
  whyMentioned: z.string().min(1),
  characterContext: z.string().nullable().default(null),
  /** Name shown in "what {name} was thinking"; falls back to a generic label. */
  contextSubject: z.string().nullable().default(null),

  // --- Provenance & lifecycle ---
  source: mentionSourceSchema,
  /** Community contributor; null for curated/AI content. */
  contributorRef: z.string().nullable().default(null),
  externalUrl: z.url().nullable().default(null),
  status: mentionStatusSchema,
  /** Kept while rejected so the edit form can pin the reviewer's reason. */
  rejectionReason: z.string().nullable().default(null),
});

export type Mention = z.infer<typeof mentionSchema>;
