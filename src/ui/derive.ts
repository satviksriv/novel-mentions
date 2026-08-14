/**
 * Pure view-derivations for the Library and Book-detail screens — kept free of
 * React so they can be unit-tested directly. Screens call these over the merged
 * mention lists the repositories return.
 */
import type { BookOrigin, Mention, MentionKind, WorkType } from '@/domain';

import { KIND_ORDER } from './kind';

const WORK_TYPE_LABELS: Record<WorkType, string> = {
  fiction: 'Fiction',
  autobiography: 'Autobiography',
  memoir: 'Memoir',
  nonFiction: 'Nonfiction',
};

/** Display label for a book's work type, e.g. "Fiction". */
export function formatWorkType(workType: WorkType): string {
  return WORK_TYPE_LABELS[workType];
}

export interface KindCount {
  readonly kind: MentionKind;
  readonly count: number;
}

/** Per-kind counts for the kinds a book actually has, in canonical kind order. */
export function deriveKindCounts(mentions: readonly Mention[]): KindCount[] {
  const counts = new Map<MentionKind, number>();
  for (const m of mentions) counts.set(m.kind, (counts.get(m.kind) ?? 0) + 1);
  return KIND_ORDER.filter((k) => counts.has(k)).map((kind) => ({
    kind,
    count: counts.get(kind) as number,
  }));
}

/** The kinds present in a book, in canonical order — drives the filter chips. */
export function deriveFilterKinds(mentions: readonly Mention[]): MentionKind[] {
  const present = new Set(mentions.map((m) => m.kind));
  return KIND_ORDER.filter((k) => present.has(k));
}

export interface ChapterGroup {
  /** The canonical chapter/part label, e.g. "Part 1" or "Chapter 3". */
  readonly chapter: string;
  readonly mentions: Mention[];
}

/**
 * Group mentions under their chapter label, preserving the input's reading
 * order (repositories already sort by chapterOrder, then title). Mentions that
 * share a label are collected together; first-seen label order is kept.
 */
export function groupByChapter(mentions: readonly Mention[]): ChapterGroup[] {
  const groups: ChapterGroup[] = [];
  const byLabel = new Map<string, ChapterGroup>();
  for (const m of mentions) {
    let group = byLabel.get(m.chapter);
    if (!group) {
      group = { chapter: m.chapter, mentions: [] };
      byLabel.set(m.chapter, group);
      groups.push(group);
    }
    group.mentions.push(m);
  }
  return groups;
}

/** Library provenance band copy (onboarding handoff O2). */
export const PROVENANCE_BANDS = {
  seed: 'Included to get you started',
  user: 'Your library',
} as const;

export interface LibrarySection<T> {
  /** Band label — see PROVENANCE_BANDS. */
  readonly label: string;
  readonly entries: T[];
}

/**
 * Split Library entries into their provenance sections — the books that shipped
 * with the app ("Included to get you started") above the reader's own ("Your
 * library"), so a new reader never reads the curated starters as books they
 * added themselves (onboarding handoff O2, issue #46).
 *
 * Input order is preserved within each section, and **empty sections are
 * omitted** — a reader who has added nothing sees only the Included band.
 */
export function groupByProvenance<T extends { readonly book: { readonly origin: BookOrigin } }>(
  entries: readonly T[],
): LibrarySection<T>[] {
  const sections: LibrarySection<T>[] = [];
  for (const origin of ['seed', 'user'] as const) {
    const matching = entries.filter((e) => e.book.origin === origin);
    if (matching.length > 0) {
      sections.push({ label: PROVENANCE_BANDS[origin], entries: matching });
    }
  }
  return sections;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** Library subline, e.g. "2 books · 21 mentions catalogued". */
export function formatLibrarySubline(bookCount: number, mentionCount: number): string {
  return `${plural(bookCount, 'book')} · ${plural(mentionCount, 'mention')} catalogued`;
}
