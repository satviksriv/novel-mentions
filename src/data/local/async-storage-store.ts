/**
 * AsyncStorageLocalStore — the app's LocalStore, backed by AsyncStorage.
 *
 * Each collection is one JSON blob under a namespaced key. On read, records are
 * re-validated through the domain schema and anything malformed is dropped, so a
 * corrupt or stale-shape blob degrades gracefully instead of crashing a screen.
 * On write we serialize the already-validated array. User data is small (a
 * reader's own notes and logged mentions), so whole-collection read/modify/write
 * is more than fast enough for the MVP; Phase 2 can move to SQLite behind this
 * same interface.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  safeParseBook,
  safeParseMention,
  safeParseUserNote,
  type Book,
  type Mention,
  type ParseResult,
  type UserNote,
} from '@/domain';

import type { LocalStore } from './local-store';

const KEYS = {
  mentions: 'nm.userMentions',
  notes: 'nm.userNotes',
  books: 'nm.userBooks',
} as const;

/** Read a JSON array under `key`, keeping only records that re-validate. */
async function readValidated<T>(key: string, parse: (input: unknown) => ParseResult<T>): Promise<T[]> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return [];
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsedJson)) return [];
  const out: T[] = [];
  for (const item of parsedJson) {
    const result = parse(item);
    if (result.success) out.push(result.data);
  }
  return out;
}

const write = (key: string, value: readonly unknown[]): Promise<void> =>
  AsyncStorage.setItem(key, JSON.stringify(value));

export class AsyncStorageLocalStore implements LocalStore {
  getUserMentions(): Promise<Mention[]> {
    return readValidated(KEYS.mentions, safeParseMention);
  }

  saveUserMentions(mentions: readonly Mention[]): Promise<void> {
    return write(KEYS.mentions, mentions);
  }

  getUserNotes(): Promise<UserNote[]> {
    return readValidated(KEYS.notes, safeParseUserNote);
  }

  saveUserNotes(notes: readonly UserNote[]): Promise<void> {
    return write(KEYS.notes, notes);
  }

  getUserBooks(): Promise<Book[]> {
    return readValidated(KEYS.books, safeParseBook);
  }

  saveUserBooks(books: readonly Book[]): Promise<void> {
    return write(KEYS.books, books);
  }
}
