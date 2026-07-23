import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

/** Library tab root — placeholder shell. The real screen is issue #7. */
export default function Library() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: t.color.bg }}
      contentContainerStyle={{ padding: t.spacing.screen, paddingTop: insets.top + t.spacing.lg, gap: t.spacing.md }}
    >
      <Text style={[t.type.screenTitle, { color: t.color.text }]}>Library</Text>
      <Text style={[t.type.subline, { color: t.color.text2 }]}>
        Navigation shell — book cards land in issue #7.
      </Text>

      <View style={{ gap: t.spacing.sm, marginTop: t.spacing.md }}>
        {[
          { id: 'perks', label: 'The Perks of Being a Wallflower' },
          { id: 'gatsby', label: 'The Great Gatsby' },
        ].map((b) => (
          <Link key={b.id} href={`/book/${b.id}`} asChild>
            <Pressable
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: t.color.surface,
                  borderColor: t.color.border,
                  borderRadius: t.radius.card,
                  opacity: pressed ? 0.6 : 1,
                },
              ]}
            >
              <Text style={[t.type.cardTitle, { color: t.color.text }]}>{b.label}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderWidth: 1,
  },
});
