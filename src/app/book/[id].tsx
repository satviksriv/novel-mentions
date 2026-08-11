import Ionicons from '@expo/vector-icons/Ionicons';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

import { BookCover } from '@/components/BookCover';
import { FilterChip } from '@/components/Chips';
import { confirmRemoveBook } from '@/components/confirm-remove-book';
import { MentionSheet } from '@/components/MentionSheet';
import { NoteSheet } from '@/components/NoteSheet';
import type { Book, Mention, MentionKind, UserNote } from '@/domain';
import { useAsync } from '@/hooks/use-async';
import { useRepositories } from '@/repositories';
import { useBookPalette, useTheme, type BookPalette } from '@/theme';
import { deriveFilterKinds, groupByChapter } from '@/ui/derive';
import { KIND_META } from '@/ui/kind';
import { noteMeta } from '@/ui/note';

type Filter = MentionKind | 'all';

export default function BookDetail() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const repos = useRepositories();

  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // Refetch when the screen regains focus (e.g. returning after deleting or
  // editing a mention on the detail screen), but skip the initial focus since
  // the first load already runs below. Without this the list shows stale data
  // until the screen re-mounts.
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
    const book = await repos.books.getById(id);
    if (!book) return { book: undefined, mentions: [] as Mention[], bookNotes: [] as UserNote[] };
    const [mentions, bookNotes] = await Promise.all([
      repos.mentions.forBook(id),
      repos.notes.bookLevelNotes(id),
    ]);
    return { book, mentions, bookNotes };
  }, [repos, id, reloadKey]);

  if (loading) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: t.color.bg }]}>
        <ActivityIndicator color={t.color.text3} />
      </View>
    );
  }

  if (error || !data?.book) {
    return <NotFound message={error ? "Couldn't load this book." : 'Book not found.'} />;
  }

  return (
    <BookDetailLoaded
      book={data.book}
      mentions={data.mentions}
      bookNotes={data.bookNotes}
      insets={insets}
      reload={reload}
    />
  );
}

function BookDetailLoaded({
  book,
  mentions,
  bookNotes,
  insets,
  reload,
}: {
  book: Book;
  mentions: Mention[];
  bookNotes: UserNote[];
  insets: EdgeInsets;
  reload: () => void;
}) {
  const t = useTheme();
  const router = useRouter();
  const repos = useRepositories();
  const palette = useBookPalette(book.palette);

  const [filter, setFilter] = useState<Filter>('all');
  const [logging, setLogging] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // null = note sheet closed; { note } = edit; {} = add a new book-level note.
  const [noteSheet, setNoteSheet] = useState<{ note?: UserNote } | null>(null);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const filterKinds = useMemo(() => deriveFilterKinds(mentions), [mentions]);
  const groups = useMemo(() => {
    const visible = filter === 'all' ? mentions : mentions.filter((m) => m.kind === filter);
    return groupByChapter(visible);
  }, [mentions, filter]);

  const handleLogMention = () => setLogging(true);

  // Remove is offered only for user-added books (#34); seed books are bundled.
  const canRemove = book.origin === 'user';
  const handleRemove = () => {
    setMenuOpen(false);
    confirmRemoveBook(book, async () => {
      try {
        await repos.removeUserBook(book.id);
        router.back(); // back to Library, which refetches on focus
      } catch {
        Alert.alert('Couldn’t remove', 'Something went wrong removing this book. Please try again.');
      }
    });
  };

  // Book-level notes (#15 / handoff A4). "Add" comes from the overflow menu;
  // editing/removing existing ones happens from the pinned card.
  const handleAddNote = () => {
    setMenuOpen(false);
    setNoteSheet({});
  };

  const saveNote = async (body: string) => {
    const target = noteSheet?.note;
    if (target) await repos.notes.update(target.id, body);
    else await repos.notes.create({ bookId: book.id, mentionId: null, body });
    setNoteSheet(null);
    reload();
  };

  const deleteNote = (note: UserNote) => {
    Alert.alert('Delete note?', 'This note will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await repos.notes.remove(note.id);
          reload();
        },
      },
    ]);
  };

  // OS share sheet (kept in MVP by owner decision). React Native's core Share
  // API — no native module, Expo Go safe.
  const handleShare = async () => {
    setMenuOpen(false);
    try {
      await Share.share({ message: `${book.title} by ${book.author}`, title: book.title });
    } catch {
      // Share dismissed or unavailable — nothing to recover.
    }
  };

  return (
    <View style={[styles.fill, { backgroundColor: t.color.bg }]}>
      {/* Themed header, pinned. */}
      <View
        style={{
          backgroundColor: palette.primary,
          paddingTop: insets.top + t.spacing.sm,
          paddingBottom: t.spacing.lg,
          paddingHorizontal: t.spacing.screen,
          gap: t.spacing.md,
        }}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={26} color={palette.onHeader} />
          </Pressable>
          <Pressable
            onPress={() => setMenuOpen(true)}
            hitSlop={12}
            accessibilityLabel="Book options"
          >
            <Ionicons name="ellipsis-horizontal" size={24} color={palette.onHeader} />
          </Pressable>
        </View>

        <View style={styles.headerRow}>
          <BookCover book={book} size="header" />
          <View style={styles.headerText}>
            <Text style={[t.type.bookHeaderTitle, { color: palette.onHeader }]} numberOfLines={3}>
              {book.title}
            </Text>
            <Text style={[t.type.body, { color: palette.onHeader, opacity: 0.9 }]}>
              {book.author}
            </Text>
            <View style={styles.mentionPill}>
              <Text style={{ fontFamily: t.font.sansSemiBold, fontSize: 12, color: palette.onHeader }}>
                {mentions.length} {mentions.length === 1 ? 'mention' : 'mentions'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.fill}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 96,
          gap: t.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {mentions.length === 0 ? (
          <>
            {bookNotes.length > 0 && (
              <BookNotesCard
                notes={bookNotes}
                palette={palette}
                expanded={notesExpanded}
                onToggle={() => setNotesExpanded((v) => !v)}
                onEditNote={(note) => setNoteSheet({ note })}
                onDeleteNote={deleteNote}
              />
            )}
            <EmptyState author={book.author} onLog={handleLogMention} />
          </>
        ) : (
          <>
            {/* Filter chips. */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              <FilterChip
                label="All"
                active={filter === 'all'}
                activeColor={palette.primary}
                onPress={() => setFilter('all')}
              />
              {filterKinds.map((kind) => (
                <FilterChip
                  key={kind}
                  label={KIND_META[kind].plural}
                  active={filter === kind}
                  activeColor={palette.primary}
                  onPress={() => setFilter(kind)}
                />
              ))}
            </ScrollView>

            {/* Pinned book-level notes (#15 / handoff A4) — under the chips. */}
            {bookNotes.length > 0 && (
              <BookNotesCard
                notes={bookNotes}
                palette={palette}
                expanded={notesExpanded}
                onToggle={() => setNotesExpanded((v) => !v)}
                onEditNote={(note) => setNoteSheet({ note })}
                onDeleteNote={deleteNote}
              />
            )}

            {/* Chapter-grouped timeline. */}
            <View style={{ paddingHorizontal: t.spacing.screen, gap: t.spacing.lg }}>
              {groups.map((group) => (
                <View key={group.chapter} style={{ gap: t.spacing.xs }}>
                  <ChapterHeader label={group.chapter} />
                  {group.mentions.map((m) => (
                    <MentionRow key={m.id} mention={m} palette={palette} />
                  ))}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      {/* FAB — log a mention (sheet lands in #9). */}
      <Pressable
        onPress={handleLogMention}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: palette.primary,
            borderRadius: t.radius.fab,
            bottom: insets.bottom + t.spacing.lg,
            boxShadow: `0px 6px 16px ${palette.primary}66`,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <Ionicons name="add" size={30} color={palette.onHeader} />
      </Pressable>

      {logging && (
        <MentionSheet
          bookId={book.id}
          defaultKind={filter === 'all' ? undefined : filter}
          onClose={() => setLogging(false)}
          onSaved={() => {
            setLogging(false);
            reload();
          }}
        />
      )}

      {noteSheet !== null && (
        <NoteSheet
          title={noteSheet.note ? 'Your note' : 'Note on this book'}
          initial={noteSheet.note?.body}
          onSave={saveNote}
          onClose={() => setNoteSheet(null)}
        />
      )}

      {/* Overflow menu — a lightweight dropdown (not a Modal, so the removal
          confirmation Alert presents cleanly on top). Backdrop dismisses it. */}
      {menuOpen && (
        <>
          <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
          <View
            style={[
              styles.menuCard,
              {
                top: insets.top + 44,
                backgroundColor: t.color.surface,
                borderColor: t.color.border,
                borderRadius: t.radius.card,
                boxShadow: t.shadow.card,
              },
            ]}
          >
            <Pressable
              onPress={handleAddNote}
              style={({ pressed }) => [
                styles.menuItem,
                styles.menuDivider,
                { borderBottomColor: t.color.line, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Ionicons name="bookmark-outline" size={19} color={t.color.text} />
              <Text style={[t.type.rowTitle, { color: t.color.text }]}>Add a note on this book</Text>
            </Pressable>
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.menuItem,
                canRemove && styles.menuDivider,
                { borderBottomColor: t.color.line, opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Ionicons name="share-social-outline" size={19} color={t.color.text} />
              <Text style={[t.type.rowTitle, { color: t.color.text }]}>Share book</Text>
            </Pressable>
            {canRemove && (
              <Pressable
                onPress={handleRemove}
                style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.6 : 1 }]}
              >
                <Ionicons name="trash-outline" size={19} color={t.status.rejected.solid} />
                <Text style={[t.type.rowTitle, { color: t.status.rejected.solid }]}>
                  Remove from library
                </Text>
              </Pressable>
            )}
          </View>
        </>
      )}
    </View>
  );
}

function ChapterHeader({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View style={styles.chapterHeader}>
      <Text style={[t.type.label, { color: t.color.text3 }]}>{label}</Text>
      <View style={[styles.rule, { backgroundColor: t.color.border }]} />
    </View>
  );
}

function MentionRow({ mention, palette }: { mention: Mention; palette: BookPalette }) {
  const t = useTheme();
  const kind = t.kind[mention.kind];
  const isOwn = mention.source === 'user';
  const attribution = [
    mention.attribution,
    mention.pageHint ? `p. ${mention.pageHint.page}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  // Row layout + separator live on this inner View, not on the Pressable:
  // expo-router's `Link asChild` doesn't reliably apply a Pressable's
  // function-returned style array, which dropped `styles.row` (flexDirection,
  // gap, bottom border) and stacked the row vertically (issue #32, same as #29).
  return (
    <Link href={`/mention/${mention.id}`} asChild>
      <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
        <View style={[styles.row, { borderBottomColor: t.color.line }]}>
          <View style={[styles.tile, { backgroundColor: kind.soft, borderRadius: t.radius.tile }]}>
            <Ionicons name={KIND_META[mention.kind].icon} size={18} color={kind.solid} />
          </View>

          <View style={styles.rowBody}>
            <View style={styles.rowTitleLine}>
              <Text style={[t.type.rowTitle, { color: t.color.text }]} numberOfLines={1}>
                {mention.title}
              </Text>
              {isOwn && (
                <View style={[styles.yours, { backgroundColor: palette.softTint }]}>
                  <Text style={[t.type.label, { color: palette.primary, fontSize: 10 }]}>Yours</Text>
                </View>
              )}
            </View>
            {attribution.length > 0 && (
              <Text style={[t.type.secondary, { color: t.color.text2 }]} numberOfLines={1}>
                {attribution}
              </Text>
            )}
            <Text style={[t.type.secondary, { color: t.color.text3 }]} numberOfLines={1}>
              {mention.whyMentioned}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={18} color={t.color.text3} />
        </View>
      </Pressable>
    </Link>
  );
}

function EmptyState({ author, onLog }: { author: string; onLog: () => void }) {
  const t = useTheme();
  return (
    <View style={[styles.center, { paddingHorizontal: t.spacing['2xl'], paddingTop: t.spacing['3xl'], gap: t.spacing.md }]}>
      <Text style={[t.type.mentionTitle, { color: t.color.text, textAlign: 'center' }]}>
        No mentions yet
      </Text>
      <Text style={[t.type.body, { color: t.color.text2, textAlign: 'center' }]}>
        Be the first to catalog the songs, films and places {author} reaches for.
      </Text>
      <Pressable
        onPress={onLog}
        style={({ pressed }) => [
          styles.cta,
          { backgroundColor: t.color.accentInk, borderRadius: t.radius.input, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={{ fontFamily: t.font.sansBold, fontSize: 13.5, color: t.color.bg }}>
          Log a mention
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * Pinned "Your notes on this book · {n}" card under the filter chips (handoff
 * A4). Collapsed: the bookmark icon, the count label, and the first note's text.
 * Tapping the header expands it to the full list; each note there is tappable to
 * edit, long-press to delete (mirroring the mention-detail note cards).
 */
function BookNotesCard({
  notes,
  palette,
  expanded,
  onToggle,
  onEditNote,
  onDeleteNote,
}: {
  notes: UserNote[];
  palette: BookPalette;
  expanded: boolean;
  onToggle: () => void;
  onEditNote: (note: UserNote) => void;
  onDeleteNote: (note: UserNote) => void;
}) {
  const t = useTheme();
  const first = notes[0];
  return (
    <View style={{ paddingHorizontal: t.spacing.screen }}>
      <View style={[styles.notesCard, { backgroundColor: palette.softTint }]}>
        <Pressable
          onPress={onToggle}
          style={styles.notesHead}
          accessibilityRole="button"
          accessibilityLabel={`Your notes on this book, ${notes.length}`}
        >
          <Ionicons name="bookmark-outline" size={18} color={palette.primary} style={styles.notesIcon} />
          <View style={styles.notesHeadBody}>
            <Text style={[t.type.label, { color: palette.primary }]}>
              Your notes on this book · {notes.length}
            </Text>
            {!expanded && first && (
              <Text style={[t.type.note, { color: t.color.text }]} numberOfLines={2}>
                {first.body}
              </Text>
            )}
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={palette.primary}
            style={styles.notesChevron}
          />
        </Pressable>

        {expanded && (
          <View style={styles.notesList}>
            {notes.map((note) => (
              <Pressable
                key={note.id}
                onPress={() => onEditNote(note)}
                onLongPress={() => onDeleteNote(note)}
                style={({ pressed }) => [
                  styles.noteMini,
                  { backgroundColor: t.color.surface, borderRadius: t.radius.note, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Text style={[t.type.note, { color: t.color.text }]}>{note.body}</Text>
                <Text style={[t.type.secondary, { color: t.color.text3 }]}>{noteMeta(note.createdAt)}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function NotFound({ message }: { message: string }) {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.fill, styles.center, { backgroundColor: t.color.bg, padding: t.spacing.screen }]}>
      <Text style={[t.type.body, { color: t.color.text2, marginBottom: t.spacing.md }]}>{message}</Text>
      <Pressable onPress={() => router.back()} hitSlop={12} style={{ paddingTop: insets.top }}>
        <Text style={[t.type.rowTitle, { color: t.color.text }]}>Go back</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { alignSelf: 'flex-start' },
  menuBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  menuCard: {
    position: 'absolute',
    right: 20,
    minWidth: 208,
    borderWidth: 1,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuDivider: { borderBottomWidth: 1 },
  headerRow: { flexDirection: 'row', gap: 14 },
  headerText: { flex: 1, gap: 4 },
  mentionPill: {
    alignSelf: 'flex-start',
    marginTop: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  chipRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingTop: 16 },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rule: { flex: 1, height: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  tile: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, gap: 2 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  yours: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: { marginTop: 8, paddingHorizontal: 22, paddingVertical: 13 },
  // Pinned book-notes card (radius 14 matches the search field / segmented
  // track — a design value with no named radius token).
  notesCard: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14 },
  notesHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  notesIcon: { marginTop: 1 },
  notesChevron: { marginTop: 2 },
  notesHeadBody: { flex: 1, gap: 4 },
  notesList: { gap: 8, marginTop: 10 },
  noteMini: { padding: 12, gap: 4 },
});
