import { coverUrlForId, normalizeDoc, OpenLibraryLookupSource } from '../open-library-source';

/** Build a fetch stub that returns the given docs as an Open Library payload. */
function fetchReturning(docs: unknown[], ok = true, status = 200): typeof fetch {
  return (async () => ({
    ok,
    status,
    json: async () => ({ docs }),
  })) as unknown as typeof fetch;
}

describe('normalizeDoc', () => {
  it('maps a full doc, deriving the medium cover URL', () => {
    expect(
      normalizeDoc({
        key: '/works/OL45804W',
        title: 'Fahrenheit 451',
        author_name: ['Ray Bradbury', 'Someone Else'],
        first_publish_year: 1953,
        cover_i: 8228691,
      }),
    ).toEqual({
      externalId: '/works/OL45804W',
      title: 'Fahrenheit 451',
      author: 'Ray Bradbury',
      year: 1953,
      coverUrl: 'https://covers.openlibrary.org/b/id/8228691-M.jpg',
    });
  });

  it('nulls missing author/year/cover, and drops docs without title or key', () => {
    expect(normalizeDoc({ key: '/works/OL1W', title: 'No Extras' })).toEqual({
      externalId: '/works/OL1W',
      title: 'No Extras',
      author: null,
      year: null,
      coverUrl: null,
    });
    expect(normalizeDoc({ key: '/works/OL2W' })).toBeNull();
    expect(normalizeDoc({ title: 'Keyless' })).toBeNull();
  });

  it('coverUrlForId returns null without a cover id', () => {
    expect(coverUrlForId(undefined)).toBeNull();
    expect(coverUrlForId(123)).toBe('https://covers.openlibrary.org/b/id/123-M.jpg');
  });
});

describe('OpenLibraryLookupSource.search', () => {
  it('returns [] for a blank query without hitting the network', async () => {
    let called = false;
    const src = new OpenLibraryLookupSource((() => {
      called = true;
      return Promise.reject(new Error('should not fetch'));
    }) as unknown as typeof fetch);
    expect(await src.search('   ')).toEqual([]);
    expect(called).toBe(false);
  });

  it('normalizes and filters the provider payload', async () => {
    const src = new OpenLibraryLookupSource(
      fetchReturning([
        { key: '/works/OL1W', title: 'Kept', author_name: ['A'], first_publish_year: 2000, cover_i: 1 },
        { key: '/works/OL2W' }, // no title → dropped
      ]),
    );
    const results = await src.search('anything');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('Kept');
  });

  it('throws on a non-ok HTTP response', async () => {
    const src = new OpenLibraryLookupSource(fetchReturning([], false, 503));
    await expect(src.search('x')).rejects.toThrow(/503/);
  });
});
