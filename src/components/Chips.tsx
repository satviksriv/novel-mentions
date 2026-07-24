/**
 * Chips — the two small pill controls shared by Library and Book detail.
 *
 * `CountChip`: a kind's icon + count on the Library card (kind-soft bg,
 * kind-solid fg). `FilterChip`: a single-select filter on Book detail (active
 * fills with the book's primary colour). Sizes here follow the handoff; colours
 * and font families come from the theme.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { MentionKind } from '@/domain';
import { useTheme } from '@/theme';

import { KIND_META } from '@/ui/kind';

export function CountChip({ kind, count }: { kind: MentionKind; count: number }) {
  const t = useTheme();
  const c = t.kind[kind];
  return (
    <View style={[styles.count, { backgroundColor: c.soft }]}>
      <Ionicons name={KIND_META[kind].icon} size={12} color={c.solid} />
      <Text style={[styles.countText, { color: c.solid, fontFamily: t.font.sansBold }]}>
        {count}
      </Text>
    </View>
  );
}

export function FilterChip({
  label,
  active,
  activeColor,
  onPress,
}: {
  label: string;
  active: boolean;
  /** Book primary — fills the chip when active. */
  activeColor: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filter,
        {
          borderRadius: t.radius.pill,
          backgroundColor: active ? activeColor : t.color.surface2,
          borderColor: active ? 'transparent' : t.color.border,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        style={{
          fontFamily: t.font.sansSemiBold,
          fontSize: 13,
          color: active ? '#FFFFFF' : t.color.text2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  countText: {
    fontSize: 12,
  },
  filter: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
});
