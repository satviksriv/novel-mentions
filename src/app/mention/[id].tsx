import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets, type EdgeInsets } from 'react-native-safe-area-context';

import type { Book, Mention, UserNote } from '@/domain';
import { MentionSheet } from '@/components/MentionSheet';
import { NoteSheet } from '@/components/NoteSheet';
import { useAsync } from '@/hooks/use-async';
import { useRepositories } from '@/repositories';
import { useBookPalette, useTheme } from '@/theme';
import { KIND_META } from '@/ui/kind';
import { noteMeta } from '@/ui/note';
import { STATUS_META } from '@/ui/status';

/** The "What {name} was thinking" label — the subject, or a work-type fallback. */
function thinkingLabel(mention: Mention, book: Book): string {
  if (mention.contextSubject) return `What ${mention.contextSubject} was thinking`;
  return book.workType === 'fiction'
    ? 'What the character was thinking'
    : 'What the author was thinking';
}

/** Mention detail — pushed screen (tab bar hidden). Everything about one mention + the reader's notes. */
export default function MentionDetail() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const repos = useRepositories();

  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const { data, loading, error } = useAsync(async () => {
    const mention = await repos.mentions.getById(id);
    if (!mention) return null;
    const book = await repos.books.getById(mention.bookId);
    if (!book) return null;
    const notes = await repos.notes.forMention(id);
    return { mention, book, notes };
  }, [repos, id, reloadKey]);

  if (loading) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: t.color.bg }]}>
        <ActivityIndicator color={t.color.text3} />
      </View>
    );
  }

  if (error || !data) {
    return <NotFound message={error ? "Couldn't load this mention." : 'Mention not found.'} />;
  }

  return (
    <MentionDetailLoaded
      mention={data.mention}
      book={data.book}
      notes={data.notes}
      insets={insets}
      reload={reload}
    />
  );
}

function MentionDetailLoaded({
  mention,
  book,
  notes,
  insets,
  reload,
}: {
  mention: Mention;
  book: Book;
  notes: UserNote[];
  insets: EdgeInsets;
  reload: () => void;
}) {
  const t = useTheme();
  const router = useRouter();
  const repos = useRepositories();
  const palette = useBookPalette(book.palette);
  const kind = t.kind[mention.kind];

  // null = sheet closed; { note } present = edit; { note: undefined } = add.
  const [sheet, setSheet] = useState<{ note?: UserNote } | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const isOwn = mention.source === 'user';

  const location = [mention.chapter, mention.positionHint, mention.pageHint ? `p. ${mention.pageHint.page}` : null]
    .filter(Boolean)
    .join(' · ');

  const saveNote = async (body: string) => {
    const target = sheet?.note;
    if (target) await repos.notes.update(target.id, body);
    else await repos.notes.create({ bookId: book.id, mentionId: mention.id, body });
    setSheet(null);
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

  const submitForReview = async () => {
    setBusy(true);
    try {
      await repos.mentions.applyLifecycle(mention.id, 'submit');
      reload();
    } finally {
      setBusy(false);
    }
  };

  const deleteMention = () => {
    Alert.alert('Delete mention?', 'This removes your logged mention. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await repos.mentions.remove(mention.id);
          router.back();
        },
      },
    ]);
  };

  const editMention = () => setEditing(true);

  return (
    <View style={[styles.fill, { backgroundColor: t.color.bg }]}>
      {/* Plain nav bar — back + book title. */}
      <View
        style={{
          paddingTop: insets.top + t.spacing.sm,
          paddingBottom: t.spacing.sm,
          paddingHorizontal: t.spacing.screen,
          flexDirection: 'row',
          alignItems: 'center',
          gap: t.spacing.sm,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={t.color.text} />
        </Pressable>
        <Text style={[t.type.secondary, { color: t.color.text2, flex: 1 }]} numberOfLines={1}>
          {book.title}
        </Text>
      </View>

      <ScrollView
        style={styles.fill}
        contentContainerStyle={{
          paddingHorizontal: t.spacing.screen,
          paddingBottom: insets.bottom + t.spacing['2xl'],
          gap: t.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Badges. */}
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: kind.soft }]}>
            <Ionicons name={KIND_META[mention.kind].icon} size={13} color={kind.solid} />
            <Text style={[t.type.label, { color: kind.solid }]}>{KIND_META[mention.kind].singular}</Text>
          </View>
          {isOwn && (
            <View style={[styles.badge, { backgroundColor: t.status[mention.status].soft }]}>
              <Text style={[t.type.label, { color: t.status[mention.status].solid }]}>
                {STATUS_META[mention.status].label}
              </Text>
            </View>
          )}
        </View>

        {/* Title + attribution. */}
        <View style={{ gap: t.spacing.xs }}>
          <Text style={[t.type.mentionTitle, { color: t.color.text }]}>{mention.title}</Text>
          {mention.attribution && (
            <Text style={[t.type.body, { color: t.color.text2 }]}>{mention.attribution}</Text>
          )}
        </View>

        {/* Location. */}
        {location.length > 0 && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={15} color={t.color.text3} />
            <Text style={[t.type.secondary, { color: t.color.text2 }]}>
              {location}
              {mention.pageHint ? (
                <Text style={{ color: t.color.text3 }}>{`  (${mention.pageHint.edition})`}</Text>
              ) : null}
            </Text>
          </View>
        )}

        {/* Excerpt pull-quote. */}
        {mention.excerpt && (
          <View style={[styles.pullQuote, { borderLeftColor: kind.solid }]}>
            <Text style={[t.type.excerpt, { color: t.color.text }]}>{mention.excerpt}</Text>
          </View>
        )}

        {/* Context blocks. */}
        <ContextBlock label="Why it's here" body={mention.whyMentioned} />
        {mention.characterContext && (
          <ContextBlock label={thinkingLabel(mention, book)} body={mention.characterContext} />
        )}

        {/* Owner actions. */}
        {isOwn && (
          <View style={{ gap: t.spacing.md, marginTop: t.spacing.xs }}>
            {mention.status === 'personal' && (
              <View style={{ gap: t.spacing.xs }}>
                <Pressable
                  onPress={submitForReview}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.submitBtn,
                    { backgroundColor: palette.primary, borderRadius: t.radius.input, opacity: pressed || busy ? 0.85 : 1 },
                  ]}
                >
                  <Ionicons name="arrow-up-circle-outline" size={18} color={palette.onHeader} />
                  <Text style={{ fontFamily: t.font.sansBold, fontSize: 13.5, color: palette.onHeader }}>
                    Submit for review
                  </Text>
                </Pressable>
                <Text style={[t.type.secondary, { color: t.color.text3, textAlign: 'center' }]}>
                  We&apos;ll fact-check it, then publish for other readers.
                </Text>
              </View>
            )}

            <View style={styles.ownerBtnRow}>
              <Pressable
                onPress={editMention}
                style={({ pressed }) => [
                  styles.outlineBtn,
                  { borderColor: t.color.border, borderRadius: t.radius.input, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Ionicons name="create-outline" size={16} color={t.color.text} />
                <Text style={[t.type.rowTitle, { color: t.color.text }]}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={deleteMention}
                style={({ pressed }) => [
                  styles.outlineBtn,
                  { borderColor: t.status.rejected.solid, borderRadius: t.radius.input, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Ionicons name="trash-outline" size={16} color={t.status.rejected.solid} />
                <Text style={[t.type.rowTitle, { color: t.status.rejected.solid }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Your notes. */}
        <View style={{ gap: t.spacing.sm, marginTop: t.spacing.sm }}>
          <Text style={[t.type.label, { color: t.color.text3 }]}>Your notes</Text>
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => setSheet({ note })}
              onDelete={() => deleteNote(note)}
            />
          ))}
          <Pressable
            onPress={() => setSheet({})}
            style={({ pressed }) => [
              styles.addNote,
              { borderColor: t.color.border, borderRadius: t.radius.input, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Ionicons name="add" size={18} color={t.color.text2} />
            <Text style={[t.type.rowTitle, { color: t.color.text2 }]}>Add a note</Text>
          </Pressable>
        </View>
      </ScrollView>

      {sheet !== null && (
        <NoteSheet
          initial={sheet.note?.body}
          onSave={saveNote}
          onClose={() => setSheet(null)}
        />
      )}

      {editing && (
        <MentionSheet
          bookId={book.id}
          initial={mention}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            reload();
          }}
        />
      )}
    </View>
  );
}

function ContextBlock({ label, body }: { label: string; body: string }) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.xs }}>
      <Text style={[t.type.label, { color: t.color.text3 }]}>{label}</Text>
      <Text style={[t.type.body, { color: t.color.text }]}>{body}</Text>
    </View>
  );
}

function NoteCard({
  note,
  onEdit,
  onDelete,
}: {
  note: UserNote;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onEdit}
      onLongPress={onDelete}
      style={({ pressed }) => [
        styles.noteCard,
        { backgroundColor: t.color.surface2, borderRadius: t.radius.note, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[t.type.note, { color: t.color.text }]}>{note.body}</Text>
      <Text style={[t.type.secondary, { color: t.color.text3 }]}>{noteMeta(note.createdAt)}</Text>
    </Pressable>
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
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pullQuote: { borderLeftWidth: 3, paddingLeft: 15 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  ownerBtnRow: { flexDirection: 'row', gap: 12 },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1,
  },
  noteCard: { padding: 14, gap: 6 },
  addNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
});
