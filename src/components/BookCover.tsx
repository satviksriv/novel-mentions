/**
 * BookCover — the stylized placeholder cover: a per-book diagonal gradient with
 * a spine line and the title/author lettered on in white. One gradient per book
 * (from `book.palette.coverGradient`), used identically on the Library card and
 * the Book-detail header. Real cover art (issue #12+) will layer over this as
 * the loading/fallback state.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import type { Book } from '@/domain';
import { useTheme } from '@/theme';

/** Cover footprints from the handoff (radius 9; mini radius 6). */
const SIZES = {
  card: { width: 76, height: 108, radius: 9 },
  header: { width: 66, height: 94, radius: 9 },
  mini: { width: 42, height: 60, radius: 6 },
} as const;

export type BookCoverSize = keyof typeof SIZES;

export function BookCover({
  book,
  size = 'card',
  showText = true,
}: {
  book: Book;
  size?: BookCoverSize;
  showText?: boolean;
}) {
  const t = useTheme();
  const dims = SIZES[size];
  const [from, to] = book.palette.coverGradient;
  const compact = size === 'mini';

  return (
    <LinearGradient
      colors={[from, to]}
      // ~160° diagonal (top-left → bottom-right) per the handoff gradient.
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[
        styles.cover,
        { width: dims.width, height: dims.height, borderRadius: dims.radius },
      ]}
    >
      {/* Thin dark spine line, inset from the left edge. */}
      <View style={styles.spine} />
      {showText && !compact && (
        <View style={styles.text}>
          <Text style={[t.type.coverTitle, styles.onCover]} numberOfLines={3}>
            {book.title}
          </Text>
          <Text style={[t.type.coverAuthor, styles.onCover]} numberOfLines={1}>
            {book.author}
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  cover: {
    overflow: 'hidden',
  },
  spine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 9,
    width: 3,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  text: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    gap: 2,
  },
  onCover: {
    color: '#FFFFFF',
  },
});
