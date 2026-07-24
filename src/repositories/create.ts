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
import { NoopRemoteContentSource } from '@/data/remote/remote-content-source';
import { SeedSource } from '@/data/seed/source';

import { BookRepository } from './book-repository';
import type { RepoDeps } from './deps';
import { MentionRepository } from './mention-repository';
import { NoteRepository } from './note-repository';

export interface Repositories {
  books: BookRepository;
  mentions: MentionRepository;
  notes: NoteRepository;
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
  return {
    books: new BookRepository(seed, local),
    mentions: new MentionRepository(seed, local, remote, deps),
    notes: new NoteRepository(local, deps),
  };
}
