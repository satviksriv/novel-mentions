/**
 * useStarterShelf — the bundled books plus their per-kind counts, for onboarding
 * beat 3 (handoff O1). Shared by the first-run gate and the Library's replay of
 * the welcome, so the "these came with the app" art is built one way only.
 *
 * `enabled` short-circuits the read: the gate skips it entirely for a reader who
 * has already seen the welcome, so a returning launch touches no extra storage.
 */
import type { StarterBook } from '@/components/WelcomePager';
import { useAsync } from '@/hooks/use-async';
import { useRepositories } from '@/repositories';
import { deriveKindCounts } from '@/ui/derive';

export function useStarterShelf(enabled = true): {
  starters: StarterBook[];
  loading: boolean;
} {
  const repos = useRepositories();

  const { data, loading } = useAsync<StarterBook[]>(async () => {
    if (!enabled) return [];
    const books = await repos.books.list();
    const bundled = books.filter((b) => b.origin === 'seed');
    return Promise.all(
      bundled.map(async (book) => ({
        book,
        counts: deriveKindCounts(await repos.mentions.forBook(book.id)),
      })),
    );
  }, [repos, enabled]);

  return { starters: data ?? [], loading: enabled && loading };
}
