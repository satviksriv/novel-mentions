/**
 * Seed document schema — the shape of a bundled seed asset and of the AI
 * extraction script's output. One book per file: the book plus its mentions.
 *
 * "One JSON schema everywhere": seed mentions reuse the base mention shape, so
 * the same records flow through bundled assets, extraction output, and future
 * API payloads. Seed-specific invariants (pre-reviewed, published, no human
 * contributor) are layered on here.
 */
import { z } from 'zod';

import { bookSchema } from './book';
import { mentionSchema } from './mention';

/** Bumped when the seed shape changes incompatibly; assets carry it explicitly. */
export const SEED_SCHEMA_VERSION = 1;

/** A mention as it appears in seed content: curated/AI, already published. */
export const seedMentionSchema = mentionSchema.superRefine((m, ctx) => {
  if (m.source === 'user') {
    ctx.addIssue({ code: 'custom', path: ['source'], message: 'seed mentions cannot have source "user"' });
  }
  if (m.status !== 'published') {
    ctx.addIssue({ code: 'custom', path: ['status'], message: 'seed mentions must be "published"' });
  }
  if (m.contributorRef !== null) {
    ctx.addIssue({ code: 'custom', path: ['contributorRef'], message: 'curated/AI mentions have no contributorRef' });
  }
});

export const seedBookSchema = z
  .object({
    schemaVersion: z.literal(SEED_SCHEMA_VERSION),
    book: bookSchema.extend({ origin: z.literal('seed') }),
    mentions: z.array(seedMentionSchema),
  })
  .superRefine((doc, ctx) => {
    doc.mentions.forEach((m, i) => {
      if (m.bookId !== doc.book.id) {
        ctx.addIssue({ code: 'custom', path: ['mentions', i, 'bookId'], message: 'must equal book.id' });
      }
    });
  });

export type SeedBook = z.infer<typeof seedBookSchema>;
