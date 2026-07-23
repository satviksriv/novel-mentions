import { Ionicons } from '@expo/vector-icons';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CURATED_BOOK_PALETTES, HOUSE_FALLBACK_PALETTE, useBookPalette, useTheme } from '@/theme';
import type { CuratedBookPaletteKey } from '@/theme';

const TITLES: Record<string, string> = {
  perks: 'The Perks of Being a Wallflower',
  gatsby: 'The Great Gatsby',
};

/** Book detail — pushed screen (tab bar hidden). Placeholder; real screen is issue #7. */
export default function BookDetail() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const source = CURATED_BOOK_PALETTES[id as CuratedBookPaletteKey] ?? HOUSE_FALLBACK_PALETTE;
  const palette = useBookPalette(source);

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
      <View
        style={{
          backgroundColor: palette.primary,
          paddingTop: insets.top + t.spacing.sm,
          paddingBottom: t.spacing.lg,
          paddingHorizontal: t.spacing.screen,
          gap: t.spacing.md,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ alignSelf: 'flex-start' }}>
          <Ionicons name="chevron-back" size={26} color={palette.onHeader} />
        </Pressable>
        <Text style={[t.type.bookHeaderTitle, { color: palette.onHeader }]}>
          {TITLES[id] ?? 'Book'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.screen, gap: t.spacing.md }}>
        <Text style={[t.type.body, { color: t.color.text2 }]}>
          Mentions, filter chips and the FAB land in issue #7.
        </Text>
        <Link href="/mention/sample" style={[t.type.rowTitle, { color: palette.primary }]}>
          Open a sample mention →
        </Link>
      </ScrollView>
    </View>
  );
}
