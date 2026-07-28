/**
 * My stuff (tab root) — the reader's own contributions and private notes, with
 * review status (design handoff §5). A two-tab switch ("My mentions" / "My
 * notes") swaps the list; each row is joined to its book (mini cover + title)
 * and, for a note, to its mention. A rejected mention surfaces the reviewer's
 * reason inline and opens the log/edit sheet in resubmit mode on tap.
 *
 * Data comes straight from the repositories: allUserMentions / allUserNotes for
 * the two lists, books.list() for the join, and getById to resolve each
 * mention-note's title. The screen refetches on focus so logging or editing
 * elsewhere (Book detail, Mention detail) is reflected on return.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCover } from '@/components/BookCover';
import { BookPickerSheet } from '@/components/BookPickerSheet';
import { MentionSheet } from '@/components/MentionSheet';
import type { Book, Mention, UserNote } from '@/domain';
import { useAsync } from '@/hooks/use-async';
import { useRepositories } from '@/repositories';
import { useTheme } from '@/theme';
import { STATUS_META } from '@/ui/status';

type Tab = 'mentions' | 'notes';

interface MyStuffData {
  bookById: Map<string, Book>;
  mentions: Mention[];
  notes: UserNote[];
  /** mentionId → title, for the note context line. */
  mentionTitles: Map<string, string>;
}

export default function MyStuff() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepositories();

  const [tab, setTab] = useState<Tab>('mentions');
  const [resubmit, setResubmit] = useState<Mention | null>(null);
  // Log-a-mention from here (#27): pick a book, then open MentionSheet for it.
  const [picking, setPicking] = useState(false);
  const [logBookId, setLogBookId] = useState<string | null>(null);

  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  // Refetch on re-focus (logging/editing happens on other screens), skipping
  // the initial focus since the first load runs below.
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

  const { data, loading, error } = useAsync<MyStuffData>(async () => {
    const [books, mentions, notes] = await Promise.all([
      repos.books.list(),
      repos.mentions.allUserMentions(),
      repos.notes.allUserNotes(),
    ]);
    const bookById = new Map(books.map((b) => [b.id, b]));

    // Resolve the title of each note's mention (user or seed) for its context
    // line — distinct ids only, in parallel.
    const ids = [...new Set(notes.map((n) => n.mentionId).filter((id): id is string => id !== null))];
    const resolved = await Promise.all(ids.map((id) => repos.mentions.getById(id)));
    const mentionTitles = new Map<string, string>();
    ids.forEach((id, i) => {
      const m = resolved[i];
      if (m) mentionTitles.set(id, m.title);
    });

    return { bookById, mentions, notes, mentionTitles };
  }, [repos, reloadKey]);

  // The persistent log-a-mention FAB shows on the My mentions tab once the list
  // is non-empty (the empty state carries its own CTA). Drives both the button
  // and the extra scroll clearance so the last row isn't hidden behind it.
  const showFab = !!data && tab === 'mentions' && data.mentions.length > 0;

  return (
    <View style={[styles.fill, { backgroundColor: t.color.bg }]}>
      {/* Pinned header — title + tab bar. */}
      <View
        style={{
          paddingTop: insets.top + t.spacing.lg,
          paddingHorizontal: t.spacing.screen,
          gap: t.spacing.md,
        }}
      >
        <Text style={[t.type.screenTitle, { color: t.color.text }]}>My stuff</Text>
        <View style={styles.tabBar}>
          <TabButton label="My mentions" active={tab === 'mentions'} onPress={() => setTab('mentions')} />
          <TabButton label="My notes" active={tab === 'notes'} onPress={() => setTab('notes')} />
        </View>
      </View>

      {loading && <ActivityIndicator color={t.color.text3} style={{ marginTop: t.spacing['2xl'] }} />}

      {error && (
        <Text
          style={[
            t.type.body,
            { color: t.status.rejected.solid, paddingHorizontal: t.spacing.screen, marginTop: t.spacing.lg },
          ]}
        >
          Couldn&apos;t load your stuff. Try again in a moment.
        </Text>
      )}

      {data && (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={{
            paddingHorizontal: t.spacing.screen,
            paddingTop: t.spacing.md,
            paddingBottom: insets.bottom + (showFab ? 96 : t.spacing['2xl']),
          }}
          showsVerticalScrollIndicator={false}
        >
          {tab === 'mentions' ? (
            data.mentions.length === 0 ? (
              <MentionsEmpty onLog={() => setPicking(true)} />
            ) : (
              data.mentions.map((m) => (
                <MentionRow
                  key={m.id}
                  mention={m}
                  book={data.bookById.get(m.bookId)}
                  onResubmit={() => setResubmit(m)}
                />
              ))
            )
          ) : data.notes.length === 0 ? (
            <NotesEmpty />
          ) : (
            data.notes.map((n) => (
              <NoteRow
                key={n.id}
                note={n}
                book={data.bookById.get(n.bookId)}
                mentionTitle={n.mentionId ? data.mentionTitles.get(n.mentionId) : undefined}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Persistent log-a-mention FAB (#39) — only on the My mentions tab, and
          only when the list is non-empty (the empty state has its own CTA).
          Book-agnostic here, so it uses the app-level accent ink rather than a
          per-book palette. Opens the same book-picker → MentionSheet flow. */}
      {showFab && (
        <Pressable
          onPress={() => setPicking(true)}
          accessibilityLabel="Log a mention"
          style={({ pressed }) => [
            styles.fab,
            {
              backgroundColor: t.color.accentInk,
              borderRadius: t.radius.fab,
              bottom: insets.bottom + t.spacing.lg,
              boxShadow: t.shadow.card,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="add" size={30} color={t.color.bg} />
        </Pressable>
      )}

      {resubmit && (
        <MentionSheet
          bookId={resubmit.bookId}
          initial={resubmit}
          onClose={() => setResubmit(null)}
          onSaved={() => {
            setResubmit(null);
            reload();
          }}
        />
      )}

      {picking && (
        <BookPickerSheet
          onClose={() => setPicking(false)}
          onPick={(bookId) => {
            setPicking(false);
            setLogBookId(bookId);
          }}
        />
      )}

      {logBookId && (
        <MentionSheet
          bookId={logBookId}
          onClose={() => setLogBookId(null)}
          onSaved={() => {
            setLogBookId(null);
            reload();
          }}
        />
      )}
    </View>
  );
}

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.tab} hitSlop={6}>
      <Text
        style={{
          fontFamily: active ? t.font.sansBold : t.font.sansMedium,
          fontSize: 15,
          color: active ? t.color.text : t.color.text3,
        }}
      >
        {label}
      </Text>
      <View
        style={[
          styles.tabRule,
          { backgroundColor: active ? t.color.accentInk : 'transparent' },
        ]}
      />
    </Pressable>
  );
}

/** A row in My mentions — mini cover, title + "attribution · book", status badge. */
function MentionRow({
  mention,
  book,
  onResubmit,
}: {
  mention: Mention;
  book: Book | undefined;
  onResubmit: () => void;
}) {
  const t = useTheme();
  const router = useRouter();
  const status = t.status[mention.status];
  const isRejected = mention.status === 'rejected';

  const subtitle = [mention.attribution, book?.title].filter(Boolean).join(' · ');

  // Rejected rows reopen the log/edit sheet pre-filled (resubmit); everything
  // else pushes the mention detail.
  const onPress = isRejected ? onResubmit : () => router.push(`/mention/${mention.id}`);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderBottomColor: t.color.line, opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={styles.rowTop}>
        {book ? <BookCover book={book} size="mini" showText={false} /> : <MiniCoverFallback />}

        <View style={styles.rowBody}>
          <Text style={[t.type.rowTitle, { color: t.color.text, fontSize: 14.5 }]} numberOfLines={1}>
            {mention.title}
          </Text>
          {subtitle.length > 0 && (
            <Text style={[t.type.secondary, { color: t.color.text2 }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: status.soft }]}>
          <Text style={[t.type.label, { color: status.solid, fontSize: 10 }]}>
            {STATUS_META[mention.status].label}
          </Text>
        </View>
      </View>

      {isRejected && mention.rejectionReason && (
        <View style={[styles.reason, { backgroundColor: status.soft, borderLeftColor: status.solid }]}>
          <Text style={[t.type.secondary, { color: t.color.text }]}>
            <Text style={{ fontFamily: t.font.sansBold }}>Rejected · </Text>
            {mention.rejectionReason}
            <Text style={{ color: t.color.text3 }}>  Tap to fix &amp; resubmit</Text>
          </Text>
        </View>
      )}
    </Pressable>
  );
}

/** A row in My notes — mini cover, the note text (serif italic), a context line. */
function NoteRow({
  note,
  book,
  mentionTitle,
}: {
  note: UserNote;
  book: Book | undefined;
  mentionTitle: string | undefined;
}) {
  const t = useTheme();
  const router = useRouter();

  // "On {mention} · {book}" for a mention note; "A note on the book · {book}"
  // for a whole-book note (handoff A4).
  const context = note.mentionId
    ? { lead: 'On ', strong: mentionTitle ?? 'a mention' }
    : { lead: 'A note on the book', strong: '' };

  const onPress = note.mentionId
    ? () => router.push(`/mention/${note.mentionId}`)
    : () => router.push(`/book/${note.bookId}`);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderBottomColor: t.color.line, opacity: pressed ? 0.6 : 1 }]}
    >
      <View style={styles.rowTop}>
        {book ? <BookCover book={book} size="mini" showText={false} /> : <MiniCoverFallback />}

        <View style={styles.rowBody}>
          <Text style={[t.type.note, { color: t.color.text }]} numberOfLines={3}>
            {note.body}
          </Text>
          <Text style={[t.type.secondary, { color: t.color.text2 }]} numberOfLines={1}>
            {context.lead}
            {context.strong ? <Text style={{ fontFamily: t.font.sansSemiBold }}>{context.strong}</Text> : null}
            {book ? ` · ${book.title}` : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Neutral placeholder when a row's book can't be resolved (should be rare). */
function MiniCoverFallback() {
  const t = useTheme();
  return <View style={[styles.miniFallback, { backgroundColor: t.color.surface2, borderRadius: 6 }]} />;
}

function MentionsEmpty({ onLog }: { onLog: () => void }) {
  return (
    <EmptyShell
      icon="sparkles-outline"
      title="Spotted a mention we missed?"
      body="Log the songs, films, quotes and places an author reaches for. We'll fact-check each one, then publish it for other readers."
      cta="Log a mention"
      // No book is selected here — the CTA opens a book-picker first (#27).
      onCta={onLog}
    />
  );
}

function NotesEmpty() {
  return (
    <EmptyShell
      icon="reader-outline"
      title="No notes yet"
      body="Jot a private thought on any mention — or a whole book — from its detail screen. Your notes stay yours."
    />
  );
}

function EmptyShell({
  icon,
  title,
  body,
  cta,
  onCta,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
  cta?: string;
  onCta?: () => void;
}) {
  const t = useTheme();
  return (
    <View style={[styles.empty, { paddingTop: t.spacing['3xl'] }]}>
      <View style={[styles.emptyTile, { backgroundColor: t.color.surface2, borderRadius: t.radius.card }]}>
        <Ionicons name={icon} size={26} color={t.color.text3} />
      </View>
      <Text style={[t.type.mentionTitle, { color: t.color.text, textAlign: 'center', fontSize: 22 }]}>
        {title}
      </Text>
      <Text style={[t.type.body, { color: t.color.text2, textAlign: 'center' }]}>{body}</Text>
      {cta && onCta && (
        <Pressable
          onPress={onCta}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: t.color.accentInk, borderRadius: t.radius.input, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Text style={{ fontFamily: t.font.sansBold, fontSize: 13.5, color: t.color.bg }}>{cta}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  tabBar: { flexDirection: 'row', gap: 24 },
  tab: { gap: 6, paddingBottom: 2 },
  tabRule: { height: 2, borderRadius: 1 },
  row: { paddingVertical: 12, borderBottomWidth: 1, gap: 8 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBody: { flex: 1, gap: 3 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
  },
  reason: {
    borderLeftWidth: 2,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginLeft: 54,
  },
  miniFallback: { width: 42, height: 60 },
  empty: { alignItems: 'center', gap: 12, paddingHorizontal: 12 },
  emptyTile: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center' },
  cta: { marginTop: 4, paddingHorizontal: 22, paddingVertical: 13 },
  fab: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
