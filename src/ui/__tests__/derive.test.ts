import type { Mention, MentionKind } from '@/domain';

import {
  deriveFilterKinds,
  deriveKindCounts,
  formatLibrarySubline,
  formatWorkType,
  groupByChapter,
} from '../derive';

let seq = 0;

/** A full, type-checked Mention with sensible defaults; override what a test cares about. */
function mk(over: Partial<Mention> & { kind: MentionKind; chapter: string }): Mention {
  seq += 1;
  return {
    id: `00000000-0000-4000-8000-${String(seq).padStart(12, '0')}`,
    bookId: '00000000-0000-4000-8000-000000000001',
    title: over.title ?? `Mention ${seq}`,
    attribution: null,
    chapterOrder: null,
    positionHint: null,
    pageHint: null,
    excerpt: null,
    whyMentioned: 'why',
    characterContext: null,
    contextSubject: null,
    source: 'curated',
    contributorRef: null,
    externalUrl: null,
    status: 'published',
    rejectionReason: null,
    ...over,
  };
}

describe('deriveKindCounts', () => {
  it('counts per kind and returns only present kinds in canonical order', () => {
    const mentions = [
      mk({ kind: 'book', chapter: 'Ch 1' }),
      mk({ kind: 'song', chapter: 'Ch 1' }),
      mk({ kind: 'song', chapter: 'Ch 2' }),
      mk({ kind: 'place', chapter: 'Ch 2' }),
    ];
    expect(deriveKindCounts(mentions)).toEqual([
      { kind: 'song', count: 2 },
      { kind: 'book', count: 1 },
      { kind: 'place', count: 1 },
    ]);
  });

  it('is empty for no mentions', () => {
    expect(deriveKindCounts([])).toEqual([]);
  });
});

describe('deriveFilterKinds', () => {
  it('returns present kinds in canonical order, without duplicates', () => {
    const mentions = [
      mk({ kind: 'other', chapter: 'Ch 1' }),
      mk({ kind: 'book', chapter: 'Ch 1' }),
      mk({ kind: 'song', chapter: 'Ch 1' }),
      mk({ kind: 'book', chapter: 'Ch 2' }),
    ];
    expect(deriveFilterKinds(mentions)).toEqual(['song', 'book', 'other']);
  });
});

describe('groupByChapter', () => {
  it('groups consecutive mentions under their chapter label, preserving order', () => {
    const mentions = [
      mk({ kind: 'song', chapter: 'Part 1', title: 'A' }),
      mk({ kind: 'book', chapter: 'Part 1', title: 'B' }),
      mk({ kind: 'movie', chapter: 'Part 2', title: 'C' }),
    ];
    const groups = groupByChapter(mentions);
    expect(groups.map((g) => g.chapter)).toEqual(['Part 1', 'Part 2']);
    expect(groups[0].mentions.map((m) => m.title)).toEqual(['A', 'B']);
    expect(groups[1].mentions.map((m) => m.title)).toEqual(['C']);
  });

  it('collects a repeated chapter label into one group, first-seen order kept', () => {
    const mentions = [
      mk({ kind: 'song', chapter: 'Chapter 1', title: 'A' }),
      mk({ kind: 'book', chapter: 'Chapter 3', title: 'B' }),
      mk({ kind: 'movie', chapter: 'Chapter 1', title: 'C' }),
    ];
    const groups = groupByChapter(mentions);
    expect(groups.map((g) => g.chapter)).toEqual(['Chapter 1', 'Chapter 3']);
    expect(groups[0].mentions.map((m) => m.title)).toEqual(['A', 'C']);
  });
});

describe('formatLibrarySubline', () => {
  it('pluralises books and mentions', () => {
    expect(formatLibrarySubline(2, 21)).toBe('2 books · 21 mentions catalogued');
  });

  it('uses singular for one', () => {
    expect(formatLibrarySubline(1, 1)).toBe('1 book · 1 mention catalogued');
  });
});

describe('formatWorkType', () => {
  it('maps work types to display labels', () => {
    expect(formatWorkType('fiction')).toBe('Fiction');
    expect(formatWorkType('nonFiction')).toBe('Nonfiction');
    expect(formatWorkType('memoir')).toBe('Memoir');
  });
});
