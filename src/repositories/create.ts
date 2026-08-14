/**
 * App wiring: build the repositories with real data sources and side-effects.
 *
 * This is the only module that pulls in native/Expo deps (AsyncStorage,
 * expo-crypto), so tests never import it — they construct repositories directly
 * with an InMemoryLocalStore and deterministic deps. Screens (issues #7+) call
 * `createRepositories()` once and share the result.
 */
import * as Crypto from 'expo-crypto';

import { AsyncStorageLocalStore } from '@/data/local/async-storage-store';
import type { LocalStore } from '@/data/local/local-store';
import { OpenLibraryLookupSource } from '@/data/lookup/open-library-source';
import { NoopRemoteContentSource } from '@/data/remote/remote-content-source';
import { SeedSource } from '@/data/seed/source';

import { BookRepository } from './book-repository';
import { removeUserBookCascade } from './cascade';
import type { RepoDeps } from './deps';
import { MentionRepository } from './mention-repository';
import { NoteRepository } from './note-repository';
import { UiStateRepository } from './ui-state-repository';

export interface Repositories {
  books: BookRepository;
  mentions: MentionRepository;
  notes: NoteRepository;
  /** One-shot onboarding cues (#45) — not content. */
  uiState: UiStateRepository;
  /**
   * Remove a user-added book and cascade-delete the reader's mentions and notes
   * for it (#34) — the coordinated path across the three repositories above.
   */
  removeUserBook(bookId: string): Promise<void>;
}

const realDeps: RepoDeps = {
  newId: () => Crypto.randomUUID(),
  now: () => new Date().toISOString(),
};

export function createRepositories(
  local: LocalStore = new AsyncStorageLocalStore(),
  deps: RepoDeps = realDeps,
): Repositories {
  const seed = new SeedSource();
  const remote = new NoopRemoteContentSource();
  const lookup = new OpenLibraryLookupSource();

  const books = new BookRepository(seed, local, lookup, deps);
  const mentions = new MentionRepository(seed, local, remote, deps);
  const notes = new NoteRepository(local, deps);
  const uiState = new UiStateRepository(local);

  return {
    books,
    mentions,
    notes,
    uiState,
    removeUserBook: (bookId) => removeUserBookCascade({ books, mentions, notes }, bookId),
  };
}
