import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddBookSheet } from '@/components/AddBookSheet';
import { BookCover } from '@/components/BookCover';
import { CountChip } from '@/components/Chips';
import { confirmRemoveBook } from '@/components/confirm-remove-book';
import type { Book } from '@/domain';
import { useAsync } from '@/hooks/use-async';
import { useRepositories } from '@/repositories';
import { useBookPalette, useTheme } from '@/theme';
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

  const [adding, setAdding] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // Remove a user-added book (#34): confirm, cascade-delete via the coordinated
  // repository path, then reload so the card disappears.
  const handleRemove = useCallback(
    (book: Book) => {
      confirmRemoveBook(book, async () => {
        try {
          await repos.removeUserBook(book.id);
          reload();
        } catch {
          Alert.alert('Couldn’t remove', 'Something went wrong removing this book. Please try again.');
        }
      });
    },
    [repos, reload],
  );

  // Refetch on re-focus so mention counts reflect logging done on other screens,
  // skipping the initial focus (the first load runs below).
  const firstFocus = useRef(true);
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      reload();
    }, [reload]),
  );

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
  }, [repos, reloadKey]);

  return (
    <>
      <ScrollView
        style={{ backgroundColor: t.color.bg }}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.screen,
          paddingTop: insets.top + t.spacing.lg,
          paddingBottom: insets.bottom + t.spacing['2xl'],
          gap: t.spacing.lg,
        }}
      >
        <View style={styles.titleRow}>
          <View style={{ flex: 1, gap: t.spacing.xs }}>
            <Text style={[t.type.screenTitle, { color: t.color.text }]}>Library</Text>
            <Text style={[t.type.subline, { color: t.color.text2 }]}>{data?.subline ?? ' '}</Text>
          </View>
          <Pressable
            onPress={() => setAdding(true)}
            hitSlop={8}
            accessibilityLabel="Add a book"
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: t.color.accentInk, borderRadius: t.radius.pill, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="add" size={22} color={t.color.bg} />
          </Pressable>
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
            <BookCardLink key={entry.book.id} entry={entry} onRemove={handleRemove} />
          ))}
        </View>
      </ScrollView>

      {adding && (
        <AddBookSheet
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            reload();
          }}
        />
      )}
    </>
  );
}

function BookCardLink({
  entry,
  onRemove,
}: {
  entry: LibraryEntry;
  onRemove: (book: Book) => void;
}) {
  const t = useTheme();
  const palette = useBookPalette(entry.book.palette);
  const swipeRef = useRef<Swipeable>(null);
  const { book, counts } = entry;

  // Row layout + card chrome live on this inner View, not on the Pressable:
  // expo-router's `Link asChild` doesn't reliably apply a Pressable's
  // function-returned style array, which dropped `styles.card` (flexDirection,
  // background, border) and made the card collapse to a column (issue #29).
  const card = (
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

  // Seed books are bundled and not removable — only user-added cards get the
  // swipe action (#34). Swiping reveals a Remove button; tapping it confirms
  // (reveal-then-confirm), then cascade-deletes.
  if (book.origin !== 'user') return card;

  const renderRightActions = () => (
    <Pressable
      onPress={() => {
        swipeRef.current?.close();
        onRemove(book);
      }}
      accessibilityLabel={`Remove ${book.title}`}
      style={({ pressed }) => [
        styles.removeAction,
        { backgroundColor: t.status.rejected.solid, borderRadius: t.radius.card, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <Ionicons name="trash-outline" size={20} color={palette.onHeader} />
      <Text style={{ fontFamily: t.font.sansSemiBold, fontSize: 12, color: palette.onHeader }}>
        Remove
      </Text>
    </Pressable>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
    >
      {card}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
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
  removeAction: {
    width: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginLeft: 10,
  },
});
