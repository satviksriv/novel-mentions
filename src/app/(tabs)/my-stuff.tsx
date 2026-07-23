import { ScrollView, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

/** My stuff tab root — placeholder shell. The real screen is issue #9. */
export default function MyStuff() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ backgroundColor: t.color.bg }}
      contentContainerStyle={{ padding: t.spacing.screen, paddingTop: insets.top + t.spacing.lg, gap: t.spacing.md }}
    >
      <Text style={[t.type.screenTitle, { color: t.color.text }]}>My stuff</Text>
      <Text style={[t.type.subline, { color: t.color.text2 }]}>
        Your mentions and notes — lands in issue #9.
      </Text>
    </ScrollView>
  );
}
