/**
 * (De)serialization + validation for domain records.
 *
 * `parseX` validates unknown input and throws on failure; `safeParseX` returns
 * a discriminated result instead. `serializeX` validates *before* stringifying,
 * so only well-formed records are ever written to disk or the wire. Every path
 * — bundled seed, extraction output, local DB, future API — goes through here.
 */
import { z } from 'zod';

import { bookSchema, type Book } from './book';
import { mentionSchema, type Mention } from './mention';
import { userNoteSchema, type UserNote } from './note';
import { seedBookSchema, type SeedBook } from './seed';

export type ParseResult<T> =
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: z.ZodError };

const toResult = <T>(r: z.ZodSafeParseResult<T>): ParseResult<T> =>
  r.success ? { success: true, data: r.data } : { success: false, error: r.error };

// --- Deserialize + validate (throwing) ---
export const parseBook = (input: unknown): Book => bookSchema.parse(input);
export const parseMention = (input: unknown): Mention => mentionSchema.parse(input);
export const parseUserNote = (input: unknown): UserNote => userNoteSchema.parse(input);
export const parseSeedBook = (input: unknown): SeedBook => seedBookSchema.parse(input);

// --- Deserialize + validate (non-throwing) ---
export const safeParseBook = (input: unknown): ParseResult<Book> => toResult(bookSchema.safeParse(input));
export const safeParseMention = (input: unknown): ParseResult<Mention> => toResult(mentionSchema.safeParse(input));
export const safeParseUserNote = (input: unknown): ParseResult<UserNote> => toResult(userNoteSchema.safeParse(input));
export const safeParseSeedBook = (input: unknown): ParseResult<SeedBook> => toResult(seedBookSchema.safeParse(input));

/** Parse a seed asset from its raw JSON text (JSON.parse + validate). */
export const parseSeedBookJson = (json: string): SeedBook => parseSeedBook(JSON.parse(json));

// --- Validate + serialize to JSON text ---
export const serializeBook = (book: Book): string => JSON.stringify(bookSchema.parse(book));
export const serializeMention = (mention: Mention): string => JSON.stringify(mentionSchema.parse(mention));
export const serializeUserNote = (note: UserNote): string => JSON.stringify(userNoteSchema.parse(note));
export const serializeSeedBook = (seed: SeedBook): string => JSON.stringify(seedBookSchema.parse(seed));

/** Flatten a ZodError into readable "path: message" lines for logs / the extraction script. */
export const formatIssues = (error: z.ZodError): string =>
  error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('\n');
