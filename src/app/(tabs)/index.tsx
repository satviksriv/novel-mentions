import Ionicons from '@expo/vector-icons/Ionicons';
import { Link } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCover } from '@/components/BookCover';
import { CountChip } from '@/components/Chips';
import type { Book } from '@/domain';
import { useAsync } from '@/hooks/use-async';
import { useRepositories } from '@/repositories';
import { useTheme } from '@/theme';
import { deriveKindCounts, formatLibrarySubline, formatWorkType, type KindCount } from '@/ui/derive';

interface LibraryEntry {
  book: Book;
  counts: KindCount[];
  total: number;
}

export default function Library() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepositories();

  const { data, loading, error } = useAsync(async () => {
    const books = await repos.books.list();
    const entries: LibraryEntry[] = await Promise.all(
      books.map(async (book) => {
        const mentions = await repos.mentions.forBook(book.id);
        return { book, counts: deriveKindCounts(mentions), total: mentions.length };
      }),
    );
    const totalMentions = entries.reduce((n, e) => n + e.total, 0);
    return { entries, subline: formatLibrarySubline(books.length, totalMentions) };
  }, [repos]);

  return (
    <ScrollView
      style={{ backgroundColor: t.color.bg }}
      contentContainerStyle={{
        paddingHorizontal: t.spacing.screen,
        paddingTop: insets.top + t.spacing.lg,
        paddingBottom: insets.bottom + t.spacing['2xl'],
        gap: t.spacing.lg,
      }}
    >
      <View style={{ gap: t.spacing.xs }}>
        <Text style={[t.type.screenTitle, { color: t.color.text }]}>Library</Text>
        <Text style={[t.type.subline, { color: t.color.text2 }]}>
          {data?.subline ?? ' '}
        </Text>
      </View>

      {/* Search field — visual only; behaviour lands in issue #14. */}
      <View style={[styles.search, { backgroundColor: t.color.surface2, borderRadius: 14 }]}>
        <Ionicons name="search" size={18} color={t.color.text3} />
        <Text style={{ fontFamily: t.font.sans, fontSize: 15, color: t.color.text3 }}>
          Search books &amp; mentions
        </Text>
      </View>

      {loading && <ActivityIndicator color={t.color.text3} style={{ marginTop: t.spacing.xl }} />}

      {error && (
        <Text style={[t.type.body, { color: t.status.rejected.solid }]}>
          Couldn&apos;t load your library. Pull to retry.
        </Text>
      )}

      <View style={{ gap: t.spacing.md }}>
        {data?.entries.map((entry) => (
          <BookCardLink key={entry.book.id} entry={entry} />
        ))}
      </View>
    </ScrollView>
  );
}

function BookCardLink({ entry }: { entry: LibraryEntry }) {
  const t = useTheme();
  const { book, counts } = entry;

  // Row layout + card chrome live on this inner View, not on the Pressable:
  // expo-router's `Link asChild` doesn't reliably apply a Pressable's
  // function-returned style array, which dropped `styles.card` (flexDirection,
  // background, border) and made the card collapse to a column (issue #29).
  return (
    <Link href={`/book/${book.id}`} asChild>
      <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: t.color.surface,
              borderColor: t.color.border,
              borderRadius: t.radius.card,
              boxShadow: t.shadow.card,
            },
          ]}
        >
          <BookCover book={book} size="card" />
          <View style={styles.cardBody}>
            <Text style={[t.type.cardTitle, { color: t.color.text }]} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={[t.type.secondary, { color: t.color.text2 }]} numberOfLines={1}>
              {book.author} · {formatWorkType(book.workType)}
            </Text>

            {counts.length > 0 ? (
              <View style={styles.chipRow}>
                {counts.map((c) => (
                  <CountChip key={c.kind} kind={c.kind} count={c.count} />
                ))}
              </View>
            ) : (
              <View style={[styles.emptyPill, { backgroundColor: t.color.surface2 }]}>
                <Text style={[t.type.secondary, { color: t.color.text3 }]}>No mentions yet</Text>
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  search: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  card: {
    flexDirection: 'row',
    gap: 15,
    padding: 14,
    borderWidth: 1,
  },
  cardBody: {
    flex: 1,
    gap: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  emptyPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
});
