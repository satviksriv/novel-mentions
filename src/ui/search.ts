/**
 * Library search — pure matching over books and their mentions, powering the
 * Library screen's search field (handoff Addendum A3). React-free so it can be
 * unit-tested directly. The screen supplies the already-merged book list and a
 * flat mention list; this ranks nothing — it filters, preserving input order
 * (books in library order, mentions in reading order) so results stay stable.
 */
import type { Book, Mention } from '@/domain';

export interface LibrarySearchResults {
  /** Books whose title or author matches — the "Books" group. */
  readonly books: Book[];
  /** Mentions whose title or attribution matches — the "Mentions" group. */
  readonly mentions: Mention[];
}

/** Lowercased, whitespace-collapsed query tokens; empty for a blank query. */
function tokenize(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** True when every token appears somewhere in the haystack (AND, substring). */
function matchesAll(haystack: string, tokens: readonly string[]): boolean {
  const hay = haystack.toLowerCase();
  return tokens.every((tok) => hay.includes(tok));
}

/**
 * Split a query across the two labelled result groups: books matched on
 * title + author, mentions matched on title + attribution. A blank query
 * matches nothing (the caller shows the full library instead). Input order is
 * preserved within each group.
 */
export function searchLibrary(
  books: readonly Book[],
  mentions: readonly Mention[],
  query: string,
): LibrarySearchResults {
  const tokens = tokenize(query);
  if (tokens.length === 0) return { books: [], mentions: [] };
  return {
    books: books.filter((b) => matchesAll(`${b.title} ${b.author}`, tokens)),
    mentions: mentions.filter((m) => matchesAll(`${m.title} ${m.attribution ?? ''}`, tokens)),
  };
}
