/**
 * BookPickerSheet — a lightweight bottom sheet listing the reader's library
 * books so they can log a mention without first opening a book (issue #27).
 *
 * It sits in front of the log/edit MentionSheet: the reader picks a book here,
 * then the host screen opens MentionSheet with that bookId (the sheet itself
 * keeps its single-book contract — no book-selector is added to it). Built on
 * RN's Modal — Expo Go safe, no native deps.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookCover } from '@/components/BookCover';
import type { Book } from '@/domain';
import { useAsync } from '@/hooks/use-async';
import { useRepositories } from '@/repositories';
import { useTheme } from '@/theme';
import { formatWorkType } from '@/ui/derive';

export function BookPickerSheet({
  onPick,
  onClose,
}: {
  onPick: (bookId: string) => void;
  onClose: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepositories();

  const { data: books, loading } = useAsync(() => repos.books.list(), [repos]);

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.scrim}>
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
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={[t.type.rowTitle, { color: t.color.text2 }]}>Cancel</Text>
            </Pressable>
            <Text style={[t.type.rowTitle, { color: t.color.text }]}>Log a mention</Text>
            <View style={{ width: 52 }} />
          </View>

          <Text style={[t.type.secondary, { color: t.color.text3, paddingBottom: t.spacing.sm }]}>
            Which book is it in?
          </Text>

          {loading && <ActivityIndicator color={t.color.text3} style={{ marginTop: t.spacing.xl }} />}

          {/* Effectively unreachable in the MVP — the two seed books can't be
              removed — but handled so the sheet degrades gracefully. */}
          {books && books.length === 0 && (
            <Text style={[t.type.body, { color: t.color.text2, paddingVertical: t.spacing.lg }]}>
              Add a book to your library first, then log a mention in it.
            </Text>
          )}

          {books && books.length > 0 && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: t.spacing.sm }}
            >
              {books.map((book) => (
                <BookRow key={book.id} book={book} onPress={() => onPick(book.id)} />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** A pickable book — mini cover, title, "author · work type". */
function BookRow({ book, onPress }: { book: Book; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { borderBottomColor: t.color.line, opacity: pressed ? 0.6 : 1 }]}
    >
      <BookCover book={book} size="mini" showText={false} />
      <View style={styles.rowBody}>
        <Text style={[t.type.rowTitle, { color: t.color.text }]} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={[t.type.secondary, { color: t.color.text2 }]} numberOfLines={1}>
          {book.author} · {formatWorkType(book.workType)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={t.color.text3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,8,3,0.5)' },
  sheet: { maxHeight: '70%', paddingHorizontal: 20, paddingTop: 10, gap: 4 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  rowBody: { flex: 1, gap: 3 },
});
