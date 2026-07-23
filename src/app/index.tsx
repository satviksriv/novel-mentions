import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export default function Index() {
  const t = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: t.color.bg, padding: t.spacing.screen }]}>
      <Text style={[t.type.screenTitle, { color: t.color.text }]}>Novel Mentions</Text>
      <Text style={[t.type.subline, { color: t.color.text2, textAlign: 'center' }]}>
        Theme layer wired — navigation shell lands next.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
