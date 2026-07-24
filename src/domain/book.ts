/**
 * Book — a novel or memoir in the library. Every book carries a stable UUID so
 * local records sync to a Phase-2 backend without re-keying.
 */
import { z } from 'zod';

import { bookOriginSchema, workTypeSchema } from './enums';
import { bookPaletteSchema } from './palette';

export const bookSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1),
  author: z.string().min(1),
  workType: workTypeSchema,
  synopsis: z.string().default(''),
  /** Asset reference or remote cover URL; null when the book has no cover. */
  coverRef: z.string().nullable().default(null),
  palette: bookPaletteSchema,
  origin: bookOriginSchema,
});

export type Book = z.infer<typeof bookSchema>;
