/**
 * BookLookupSource — the seam for searching a public books database when the
 * reader adds a book (issue #12, handoff A2). The UI never calls this directly;
 * it goes through `BookRepository.searchBooks`, keeping the layered contract
 * (UI → repositories → data sources). The MVP implementation is Open Library
 * (see open-library-source.ts); a Phase-3 provider swap only touches this layer.
 *
 * Results are a normalized, provider-agnostic shape — enough to render a result
 * row and seed the confirm step. `externalId` is the provider's own id (kept
 * for a possible Phase-2 dedupe/enrich), not a domain id.
 */
export interface BookLookupResult {
  /** Provider id (e.g. an Open Library work key "/works/OL45804W"). */
  readonly externalId: string;
  readonly title: string;
  readonly author: string | null;
  readonly year: number | null;
  /** Remote cover image URL, or null when the provider has no cover. */
  readonly coverUrl: string | null;
}

export interface BookLookupSource {
  /** Search the provider. Returns [] for a blank query; throws on network/HTTP failure. */
  search(query: string, opts?: { signal?: AbortSignal }): Promise<BookLookupResult[]>;
}
