/**
 * OpenLibraryLookupSource — the MVP BookLookupSource, backed by Open Library's
 * public search API (no key, free, stable cover URLs). Chosen over Google Books
 * for zero-credential access (owner decision, issue #12).
 *
 * `fetch` is injected so tests can feed canned responses without the network.
 */
import type { BookLookupResult, BookLookupSource } from './book-lookup-source';

const ENDPOINT = 'https://openlibrary.org/search.json';
/** Only the fields we render — keeps the payload small. */
const FIELDS = 'key,title,author_name,first_publish_year,cover_i';
const LIMIT = 20;

/** One raw Open Library search doc (only the fields we request). */
interface OpenLibraryDoc {
  key?: string;
  title?: string;
  author_name?: string[];
  first_publish_year?: number;
  cover_i?: number;
}

/** Medium cover by Open Library cover id. */
export function coverUrlForId(coverId: number | undefined): string | null {
  return coverId ? `https://covers.openlibrary.org/b/id/${coverId}-M.jpg` : null;
}

/** Map a raw doc to the normalized result shape; drops docs without a title. */
export function normalizeDoc(doc: OpenLibraryDoc): BookLookupResult | null {
  if (!doc.title || !doc.key) return null;
  return {
    externalId: doc.key,
    title: doc.title,
    author: doc.author_name?.[0] ?? null,
    year: doc.first_publish_year ?? null,
    coverUrl: coverUrlForId(doc.cover_i),
  };
}

export class OpenLibraryLookupSource implements BookLookupSource {
  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async search(query: string, opts?: { signal?: AbortSignal }): Promise<BookLookupResult[]> {
    const q = query.trim();
    if (!q) return [];

    const url = `${ENDPOINT}?q=${encodeURIComponent(q)}&fields=${FIELDS}&limit=${LIMIT}`;
    const res = await this.fetchFn(url, { signal: opts?.signal });
    if (!res.ok) throw new Error(`Book search failed (HTTP ${res.status})`);

    const json = (await res.json()) as { docs?: OpenLibraryDoc[] };
    return (json.docs ?? [])
      .map(normalizeDoc)
      .filter((r): r is BookLookupResult => r !== null);
  }
}
