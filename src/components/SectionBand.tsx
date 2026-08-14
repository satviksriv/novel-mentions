/**
 * SectionBand — an uppercase section label followed by a hairline rule that
 * fills the remaining width. The design system's one sectioning device: it
 * labels chapter groups on Book detail (handoff §3 "Chapter header") and the
 * provenance sections on Library ("Included to get you started" / "Your
 * library", onboarding handoff O2), which the spec defines as reusing the
 * chapter-header pattern verbatim — hence one shared component.
 */
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export function SectionBand({ label }: { label: string }) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[t.type.label, { color: t.color.text3 }]}>{label}</Text>
      <View style={[styles.rule, { backgroundColor: t.color.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rule: { flex: 1, height: 1 },
});
