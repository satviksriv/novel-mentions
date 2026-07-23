import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

/** Mention detail — pushed screen (tab bar hidden). Placeholder; real screen is issue #8. */
export default function MentionDetail() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: t.color.bg }}>
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
        <Text style={[t.type.secondary, { color: t.color.text2 }]}>Back</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: t.spacing.screen, gap: t.spacing.md }}>
        <Text style={[t.type.mentionTitle, { color: t.color.text }]}>Mention detail</Text>
        <Text style={[t.type.body, { color: t.color.text2 }]}>
          Kind badge, excerpt, context blocks and notes land in issue #8.
        </Text>
      </ScrollView>
    </View>
  );
}
