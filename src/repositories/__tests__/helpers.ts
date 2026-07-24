/**
 * Shared test doubles for the repository unit tests: deterministic RepoDeps and
 * a recording remote source. Repositories are built directly with an
 * InMemoryLocalStore so nothing touches AsyncStorage or expo-crypto.
 */
import type { Mention } from '@/domain';
import type { RemoteContentSource } from '@/data/remote/remote-content-source';

import type { RepoDeps } from '../deps';
import type { DraftMention } from '../mention-repository';

/** Counter-based UUIDs (valid v4 shape) + a clock that advances 1s per read. */
export function makeTestDeps(): RepoDeps {
  let ids = 0;
  let clock = Date.parse('2026-07-24T10:00:00.000Z');
  return {
    newId: () => `c0000000-0000-4000-8000-${(++ids).toString(16).padStart(12, '0')}`,
    now: () => {
      const iso = new Date(clock).toISOString();
      clock += 1000;
      return iso;
    },
  };
}

/** A remote source that records what was submitted, for lifecycle assertions. */
export class RecordingRemote implements RemoteContentSource {
  readonly submitted: Mention[] = [];
  async fetchBooks() {
    return [];
  }
  async fetchMentions() {
    return [];
  }
  async submitMention(mention: Mention) {
    this.submitted.push(mention);
  }
}

/** A valid DraftMention for the given book; override any field per test. */
export function draftFor(bookId: string, overrides: Partial<DraftMention> = {}): DraftMention {
  return {
    bookId,
    kind: 'quote',
    title: 'A user-logged mention',
    attribution: null,
    chapter: 'Chapter 1',
    chapterOrder: 1,
    positionHint: null,
    pageHint: null,
    excerpt: null,
    whyMentioned: 'Because I spotted it.',
    characterContext: null,
    contextSubject: null,
    externalUrl: null,
    ...overrides,
  };
}
