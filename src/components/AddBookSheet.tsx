/**
 * AddBookSheet — the add-a-book flow (issue #12, handoff A2), a full-height
 * bottom sheet with two steps:
 *
 *   search  → type a title/author, hit Open Library, pick from the results
 *             (cover, title, author · year). Loading shows skeleton rows;
 *             no results offers "Add manually".
 *   confirm → review/edit title, author and work type, see the cover, then
 *             "Add to my library" (saved locally only — no Phase-2 publishing).
 *
 * It talks to the repository (`searchBooks` / `addBook`), which owns the
 * network and the id/palette minting, and reports the saved book via onAdded so
 * the Library can refresh. Built on RN's Modal — Expo Go safe, no native deps.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Book, WorkType } from '@/domain';
import type { BookLookupResult } from '@/data/lookup/book-lookup-source';
import { useRepositories } from '@/repositories';
import { useTheme, type Theme } from '@/theme';

const WORK_TYPES: readonly { value: WorkType; label: string }[] = [
  { value: 'fiction', label: 'Fiction' },
  { value: 'nonFiction', label: 'Non-fiction' },
  { value: 'memoir', label: 'Memoir' },
  { value: 'autobiography', label: 'Autobiography' },
];

const MIN_QUERY = 2;
const DEBOUNCE_MS = 350;

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; results: BookLookupResult[]; query: string };

interface Draft {
  title: string;
  author: string;
  workType: WorkType;
  coverUrl: string | null;
}

export function AddBookSheet({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (book: Book) => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepositories();

  const [query, setQuery] = useState('');
  const [search, setSearch] = useState<SearchState>({ status: 'idle' });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  // Debounced Open Library search, cancelling any in-flight request on change.
  useEffect(() => {
    const q = query.trim();
    if (q.length < MIN_QUERY) {
      setSearch({ status: 'idle' });
      return;
    }
    const controller = new AbortController();
    setSearch({ status: 'loading' });
    const timer = setTimeout(() => {
      repos.books
        .searchBooks(q, { signal: controller.signal })
        .then((results) => setSearch({ status: 'done', results, query: q }))
        .catch(() => {
          if (!controller.signal.aborted) setSearch({ status: 'error' });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, repos]);

  const pickResult = (r: BookLookupResult) => {
    setDraft({ title: r.title, author: r.author ?? '', workType: 'fiction', coverUrl: r.coverUrl });
  };

  const addManually = () => {
    setDraft({ title: query.trim(), author: '', workType: 'fiction', coverUrl: null });
  };

  const canAdd = !!draft && draft.title.trim().length > 0 && draft.author.trim().length > 0 && !saving;

  const handleAdd = async () => {
    if (!draft || !canAdd) return;
    setSaving(true);
    try {
      const book = await repos.books.addBook({
        title: draft.title.trim(),
        author: draft.author.trim(),
        workType: draft.workType,
        coverRef: draft.coverUrl,
      });
      onAdded(book);
    } finally {
      setSaving(false);
    }
  };

  const onConfirm = draft !== null;

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.scrim}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.color.surface,
              borderTopLeftRadius: t.radius.sheet,
              borderTopRightRadius: t.radius.sheet,
              paddingBottom: insets.bottom + t.spacing.lg,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: t.color.border }]} />

          {/* Header — Cancel/Back · title. */}
          <View style={styles.header}>
            <Pressable onPress={onConfirm ? () => setDraft(null) : onClose} hitSlop={8}>
              <Text style={[t.type.rowTitle, { color: t.color.text2 }]}>
                {onConfirm ? 'Back' : 'Cancel'}
              </Text>
            </Pressable>
            <Text style={[t.type.rowTitle, { color: t.color.text }]}>
              {onConfirm ? 'Add to my library' : 'Add a book'}
            </Text>
            <View style={{ width: 48 }} />
          </View>

          {onConfirm ? (
            <ConfirmStep
              draft={draft}
              setDraft={setDraft}
              canAdd={canAdd}
              saving={saving}
              onAdd={handleAdd}
            />
          ) : (
            <SearchStep
              query={query}
              setQuery={setQuery}
              search={search}
              onPick={pickResult}
              onAddManually={addManually}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SearchStep({
  query,
  setQuery,
  search,
  onPick,
  onAddManually,
}: {
  query: string;
  setQuery: (v: string) => void;
  search: SearchState;
  onPick: (r: BookLookupResult) => void;
  onAddManually: () => void;
}) {
  const t = useTheme();

  return (
    <View style={styles.searchBody}>
      {/* Search field with a clear affordance. */}
      <View style={[styles.searchField, { backgroundColor: t.color.surface2, borderRadius: t.radius.input }]}>
        <Ionicons name="search" size={18} color={t.color.text3} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by title or author"
          placeholderTextColor={t.color.text3}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          style={{ flex: 1, fontFamily: t.font.sans, fontSize: 15, color: t.color.text }}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={t.color.text3} />
          </Pressable>
        )}
      </View>

      {search.status === 'idle' && (
        <Text style={[t.type.secondary, { color: t.color.text3, paddingTop: t.spacing.md }]}>
          Search Open Library by title or author, then pick your edition.
        </Text>
      )}

      {search.status === 'loading' && <SkeletonList />}

      {search.status === 'error' && (
        <View style={styles.centerState}>
          <Ionicons name="cloud-offline-outline" size={30} color={t.color.text3} />
          <Text style={[t.type.body, { color: t.color.text2, textAlign: 'center' }]}>
            Couldn&apos;t reach the book search. Check your connection and try again.
          </Text>
        </View>
      )}

      {search.status === 'done' && search.results.length === 0 && (
        <View style={styles.centerState}>
          <Ionicons name="search" size={30} color={t.color.text3} />
          <Text style={[t.type.rowTitle, { color: t.color.text, textAlign: 'center' }]}>
            No books found for “{search.query}”
          </Text>
          <Text style={[t.type.secondary, { color: t.color.text2, textAlign: 'center' }]}>
            Try a different title or spelling — or add it yourself.
          </Text>
          <Pressable
            onPress={onAddManually}
            style={({ pressed }) => [
              styles.manualBtn,
              { backgroundColor: t.color.accentInk, borderRadius: t.radius.input, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={{ fontFamily: t.font.sansBold, fontSize: 13.5, color: t.color.bg }}>Add manually</Text>
          </Pressable>
        </View>
      )}

      {search.status === 'done' && search.results.length > 0 && (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: t.spacing.sm }}
        >
          {search.results.map((r) => (
            <ResultRow key={r.externalId} result={r} onPress={() => onPick(r)} />
          ))}
          <Pressable onPress={onAddManually} style={styles.manualLink} hitSlop={6}>
            <Ionicons name="create-outline" size={16} color={t.color.text2} />
            <Text style={[t.type.rowTitle, { color: t.color.text2 }]}>Not here? Add manually</Text>
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function ResultRow({ result, onPress }: { result: BookLookupResult; onPress: () => void }) {
  const t = useTheme();
  const meta = [result.author, result.year ? String(result.year) : null].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.resultRow, { borderBottomColor: t.color.line, opacity: pressed ? 0.6 : 1 }]}
    >
      <CoverThumb uri={result.coverUrl} theme={t} />
      <View style={styles.resultBody}>
        <Text style={[t.type.rowTitle, { color: t.color.text }]} numberOfLines={2}>
          {result.title}
        </Text>
        {meta.length > 0 && (
          <Text style={[t.type.secondary, { color: t.color.text2 }]} numberOfLines={1}>
            {meta}
          </Text>
        )}
      </View>
      <View style={[styles.addPill, { backgroundColor: t.color.surface2 }]}>
        <Ionicons name="add" size={16} color={t.color.text} />
        <Text style={{ fontFamily: t.font.sansSemiBold, fontSize: 12, color: t.color.text }}>Add</Text>
      </View>
    </Pressable>
  );
}

function ConfirmStep({
  draft,
  setDraft,
  canAdd,
  saving,
  onAdd,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  canAdd: boolean;
  saving: boolean;
  onAdd: () => void;
}) {
  const t = useTheme();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: t.spacing.lg, paddingVertical: t.spacing.md }}
    >
      <View style={styles.confirmHead}>
        <CoverThumb uri={draft.coverUrl} theme={t} large />
        <View style={{ flex: 1, gap: t.spacing.xs, justifyContent: 'center' }}>
          <Text style={[t.type.cardTitle, { color: t.color.text }]} numberOfLines={3}>
            {draft.title || 'Untitled'}
          </Text>
          <Text style={[t.type.secondary, { color: t.color.text2 }]} numberOfLines={1}>
            {draft.author || 'Unknown author'}
          </Text>
        </View>
      </View>

      <LabeledInput
        label="Title"
        value={draft.title}
        onChangeText={(title) => setDraft({ ...draft, title })}
        placeholder="Book title"
      />
      <LabeledInput
        label="Author"
        value={draft.author}
        onChangeText={(author) => setDraft({ ...draft, author })}
        placeholder="Author name"
      />

      <View style={{ gap: t.spacing.xs }}>
        <Text style={[t.type.label, { color: t.color.text2 }]}>Type</Text>
        <View style={styles.typeRow}>
          {WORK_TYPES.map((wt) => {
            const active = wt.value === draft.workType;
            return (
              <Pressable
                key={wt.value}
                onPress={() => setDraft({ ...draft, workType: wt.value })}
                style={[
                  styles.typePill,
                  {
                    borderRadius: t.radius.pill,
                    backgroundColor: active ? t.color.accentInk : t.color.surface2,
                    borderColor: active ? 'transparent' : t.color.border,
                  },
                ]}
              >
                <Text
                  style={{
                    fontFamily: t.font.sansSemiBold,
                    fontSize: 13,
                    color: active ? t.color.bg : t.color.text2,
                  }}
                >
                  {wt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Text style={[t.type.secondary, { color: t.color.text3 }]}>
        Saved to your library only — no community publishing or fact-check yet.
      </Text>

      <Pressable
        onPress={onAdd}
        disabled={!canAdd}
        style={({ pressed }) => [
          styles.addBtn,
          {
            backgroundColor: t.color.accentInk,
            borderRadius: t.radius.input,
            opacity: !canAdd ? 0.45 : pressed ? 0.85 : 1,
          },
        ]}
      >
        {saving ? (
          <ActivityIndicator color={t.color.bg} />
        ) : (
          <Text style={{ fontFamily: t.font.sansBold, fontSize: 14.5, color: t.color.bg }}>
            Add to my library
          </Text>
        )}
      </Pressable>
    </ScrollView>
  );
}

function CoverThumb({ uri, theme, large }: { uri: string | null; theme: Theme; large?: boolean }) {
  const dims = large ? { width: 66, height: 94 } : { width: 42, height: 60 };
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[dims, { borderRadius: 6, backgroundColor: theme.color.surface2 }]}
        contentFit="cover"
        transition={150}
      />
    );
  }
  return (
    <View style={[dims, styles.coverFallback, { backgroundColor: theme.color.surface2, borderRadius: 6 }]}>
      <Ionicons name="book-outline" size={large ? 24 : 16} color={theme.color.text3} />
    </View>
  );
}

function SkeletonList() {
  const t = useTheme();
  return (
    <View style={{ paddingTop: t.spacing.md, gap: t.spacing.sm }}>
      <View style={styles.searchingRow}>
        <ActivityIndicator color={t.color.text3} />
        <Text style={[t.type.secondary, { color: t.color.text3 }]}>Searching…</Text>
      </View>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.resultRow}>
          <View style={[styles.skelCover, { backgroundColor: t.color.surface2 }]} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={[styles.skelLine, { backgroundColor: t.color.surface2, width: '70%' }]} />
            <View style={[styles.skelLine, { backgroundColor: t.color.surface2, width: '40%' }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function LabeledInput({
  label,
  ...input
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
}) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.xs }}>
      <Text style={[t.type.label, { color: t.color.text2 }]}>{label}</Text>
      <TextInput
        placeholderTextColor={t.color.text3}
        style={[
          styles.input,
          {
            color: t.color.text,
            backgroundColor: t.color.bg,
            borderColor: t.color.border,
            borderRadius: t.radius.input,
            fontFamily: t.font.sans,
          },
        ]}
        {...input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,8,3,0.5)' },
  sheet: { height: '92%', paddingHorizontal: 20, paddingTop: 10, gap: 6 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  searchBody: { flex: 1, gap: 4 },
  searchField: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 12, marginTop: 6 },
  centerState: { alignItems: 'center', gap: 10, paddingHorizontal: 24, paddingTop: 48 },
  manualBtn: { marginTop: 6, paddingHorizontal: 22, paddingVertical: 12 },
  manualLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 16 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1 },
  resultBody: { flex: 1, gap: 3 },
  addPill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  coverFallback: { alignItems: 'center', justifyContent: 'center' },
  skelCover: { width: 42, height: 60, borderRadius: 6 },
  skelLine: { height: 12, borderRadius: 6 },
  searchingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  confirmHead: { flexDirection: 'row', gap: 14, paddingTop: 6 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typePill: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  addBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 15 },
});
