import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AddBookSheet } from '@/components/AddBookSheet';
import { BookCover } from '@/components/BookCover';
import { CountChip } from '@/components/Chips';
import { confirmRemoveBook } from '@/components/confirm-remove-book';
import type { Book, Mention } from '@/domain';
import { useAsync } from '@/hooks/use-async';
import { useRepositories } from '@/repositories';
import { useBookPalette, useTheme } from '@/theme';
import { deriveKindCounts, formatLibrarySubline, formatWorkType, type KindCount } from '@/ui/derive';
import { KIND_META } from '@/ui/kind';
import { searchLibrary } from '@/ui/search';

interface LibraryEntry {
  book: Book;
  mentions: Mention[];
  counts: KindCount[];
  total: number;
}

export default function Library() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepositories();

  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');
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
        return { book, mentions, counts: deriveKindCounts(mentions), total: mentions.length };
      }),
    );
    const totalMentions = entries.reduce((n, e) => n + e.total, 0);
    // Flat mention list (in book, then reading order) + a book lookup, both for
    // search results — Mentions rows show "… · in {book}".
    const allMentions = entries.flatMap((e) => e.mentions);
    const bookById = new Map(books.map((b) => [b.id, b]));
    return {
      books,
      entries,
      allMentions,
      bookById,
      subline: formatLibrarySubline(books.length, totalMentions),
    };
  }, [repos, reloadKey]);

  const trimmedQuery = query.trim();
  const searching = trimmedQuery.length > 0;
  const results = data
    ? searchLibrary(data.books, data.allMentions, trimmedQuery)
    : { books: [], mentions: [] };

  return (
    <>
      <ScrollView
        style={{ backgroundColor: t.color.bg }}
        keyboardShouldPersistTaps="handled"
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

        {/* Search field — matches books and mentions (#14 / handoff A3). */}
        <View style={[styles.search, { backgroundColor: t.color.surface2, borderRadius: 14 }]}>
          <Ionicons name="search" size={18} color={t.color.text3} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search books & mentions"
            placeholderTextColor={t.color.text3}
            style={[styles.searchInput, { fontFamily: t.font.sans, color: t.color.text }]}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searching && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={t.color.text3} />
            </Pressable>
          )}
        </View>

        {loading && <ActivityIndicator color={t.color.text3} style={{ marginTop: t.spacing.xl }} />}

        {error && (
          <Text style={[t.type.body, { color: t.status.rejected.solid }]}>
            Couldn&apos;t load your library. Pull to retry.
          </Text>
        )}

        {!loading && !error && data && (
          searching ? (
            <SearchResults
              results={results}
              query={trimmedQuery}
              bookById={data.bookById}
              onAddBook={() => setAdding(true)}
            />
          ) : (
            <View style={{ gap: t.spacing.md }}>
              {data.entries.map((entry) => (
                <BookCardLink key={entry.book.id} entry={entry} onRemove={handleRemove} />
              ))}
            </View>
          )
        )}
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

/**
 * Search results — the two labelled groups (handoff A3). Books first (rows →
 * Book detail), then Mentions (kind icon + title + "{attribution} · in {book}"
 * → Mention detail). When neither group matches, the combined empty state.
 */
function SearchResults({
  results,
  query,
  bookById,
  onAddBook,
}: {
  results: { books: Book[]; mentions: Mention[] };
  query: string;
  bookById: Map<string, Book>;
  onAddBook: () => void;
}) {
  const t = useTheme();
  const { books, mentions } = results;

  if (books.length === 0 && mentions.length === 0) {
    return <NoMatches query={query} onAddBook={onAddBook} />;
  }

  return (
    <View style={{ gap: t.spacing.xl }}>
      {books.length > 0 && (
        <View style={{ gap: t.spacing.xs }}>
          <Text style={[t.type.label, { color: t.color.text3 }]}>Books</Text>
          {books.map((book) => (
            <BookResultRow key={book.id} book={book} />
          ))}
        </View>
      )}
      {mentions.length > 0 && (
        <View style={{ gap: t.spacing.xs }}>
          <Text style={[t.type.label, { color: t.color.text3 }]}>Mentions</Text>
          {mentions.map((mention) => (
            <MentionResultRow key={mention.id} mention={mention} book={bookById.get(mention.bookId)} />
          ))}
        </View>
      )}
    </View>
  );
}

/** A book search result — mini cover, title, "author · work type" → Book detail. */
function BookResultRow({ book }: { book: Book }) {
  const t = useTheme();
  // Layout lives on the inner View, not the Pressable's function-style, so
  // `Link asChild` can't drop it (the #29/#32 Link-asChild style bug).
  return (
    <Link href={`/book/${book.id}`} asChild>
      <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        <View style={[styles.resultRow, { borderBottomColor: t.color.line }]}>
          <BookCover book={book} size="mini" showText={false} />
          <View style={styles.resultBody}>
            <Text style={[t.type.rowTitle, { color: t.color.text }]} numberOfLines={1}>
              {book.title}
            </Text>
            <Text style={[t.type.secondary, { color: t.color.text2 }]} numberOfLines={1}>
              {book.author} · {formatWorkType(book.workType)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={t.color.text3} />
        </View>
      </Pressable>
    </Link>
  );
}

/** A mention search result — kind icon, title, "{attribution} · in {book}" → Mention detail. */
function MentionResultRow({ mention, book }: { mention: Mention; book: Book | undefined }) {
  const t = useTheme();
  const kc = t.kind[mention.kind];
  const subtitle = [mention.attribution, book ? `in ${book.title}` : null].filter(Boolean).join(' · ');

  return (
    <Link href={`/mention/${mention.id}`} asChild>
      <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        <View style={[styles.resultRow, { borderBottomColor: t.color.line }]}>
          <View style={[styles.kindIcon, { backgroundColor: kc.soft }]}>
            <Ionicons name={KIND_META[mention.kind].icon} size={17} color={kc.solid} />
          </View>
          <View style={styles.resultBody}>
            <Text style={[t.type.rowTitle, { color: t.color.text }]} numberOfLines={1}>
              {mention.title}
            </Text>
            {subtitle.length > 0 && (
              <Text style={[t.type.secondary, { color: t.color.text2 }]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={18} color={t.color.text3} />
        </View>
      </Pressable>
    </Link>
  );
}

/** Combined empty state — query matched neither a book nor a mention (A3). */
function NoMatches({ query, onAddBook }: { query: string; onAddBook: () => void }) {
  const t = useTheme();
  const router = useRouter();
  return (
    <View style={styles.noMatch}>
      <View style={[styles.noMatchTile, { backgroundColor: t.color.surface2, borderRadius: t.radius.card }]}>
        <Ionicons name="search" size={24} color={t.color.text3} />
      </View>
      <Text style={[t.type.mentionTitle, { color: t.color.text, textAlign: 'center', fontSize: 22 }]}>
        {`No matches for “${query}”`}
      </Text>
      <Text style={[t.type.body, { color: t.color.text2, textAlign: 'center' }]}>
        {"We couldn't find a book or a mention. Check the spelling, or add something new."}
      </Text>
      <Pressable
        onPress={onAddBook}
        style={({ pressed }) => [
          styles.noMatchCta,
          { backgroundColor: t.color.accentInk, borderRadius: t.radius.input, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={{ fontFamily: t.font.sansBold, fontSize: 13.5, color: t.color.bg }}>Add a book</Text>
      </Pressable>
      {/* Secondary CTA. Until a global log-a-mention picker exists (#27), point
          the reader at My stuff, where the "log a mention" flow lives. */}
      <Pressable onPress={() => router.navigate('/my-stuff')} hitSlop={8}>
        <Text style={[t.type.rowTitle, { color: t.color.text2 }]}>or log a mention you spotted</Text>
      </Pressable>
    </View>
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
  searchInput: { flex: 1, fontSize: 15, padding: 0 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultBody: { flex: 1, gap: 3 },
  kindIcon: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  noMatch: { alignItems: 'center', gap: 12, paddingTop: 40, paddingHorizontal: 12 },
  noMatchTile: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  noMatchCta: { marginTop: 4, paddingHorizontal: 22, paddingVertical: 13 },
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
