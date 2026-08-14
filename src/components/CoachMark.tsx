/**
 * CoachMark — a one-time contextual tip anchored to a real control (handoff O3).
 *
 * Deliberately built from the neutral layer only (`surface` + `border` +
 * `shadow`): the kind and status palettes carry meaning elsewhere in the app, so
 * a teaching callout borrowing them would read as a category or a state.
 *
 * The pointer is the standard rotated-square trick — a 15pt square turned 45°
 * with only the two edges facing the anchor stroked, tucked far enough under the
 * card that its back half is hidden behind it.
 *
 * Pure presentation: the host decides when to show one and persists the matching
 * seen-flag on dismiss.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/theme';

export function CoachMark({
  title,
  body,
  icon,
  pointer,
  pointerAlign = 'center',
  onDismiss,
}: {
  title: string;
  body: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Which side the pointer sits on — i.e. where the anchored control is. */
  pointer: 'up' | 'down';
  pointerAlign?: 'start' | 'center' | 'end';
  onDismiss: () => void;
}) {
  const t = useTheme();

  const alignSelf =
    pointerAlign === 'start' ? 'flex-start' : pointerAlign === 'end' ? 'flex-end' : 'center';

  const pointerNode = (
    <View
      style={[
        styles.pointer,
        pointer === 'up' ? styles.pointerUp : styles.pointerDown,
        { alignSelf, backgroundColor: t.color.surface, borderColor: t.color.border },
      ]}
    />
  );

  return (
    <View>
      {pointer === 'up' && pointerNode}
      <View
        style={[
          styles.card,
          {
            backgroundColor: t.color.surface,
            borderColor: t.color.border,
            boxShadow: t.shadow.card,
          },
        ]}
      >
        <View style={styles.head}>
          {icon && (
            <View style={[styles.tile, { backgroundColor: t.color.surface2 }]}>
              <Ionicons name={icon} size={14} color={t.color.text2} />
            </View>
          )}
          <Text style={[styles.title, { fontFamily: t.font.sansSemiBold, color: t.color.text }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.body, { fontFamily: t.font.sans, color: t.color.text2 }]}>{body}</Text>
        <Pressable onPress={onDismiss} hitSlop={10} style={styles.dismiss} accessibilityRole="button">
          <Text style={{ fontFamily: t.font.sansBold, fontSize: 13, color: t.color.accentInk }}>
            Got it
          </Text>
        </Pressable>
      </View>
      {pointer === 'down' && pointerNode}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 15, gap: 6 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  tile: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, flexShrink: 1 },
  body: { fontSize: 12.5, lineHeight: 17.8 },
  dismiss: { alignSelf: 'flex-start', paddingTop: 2 },
  pointer: {
    width: 15,
    height: 15,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 22,
  },
  // Only the two edges facing the anchor are stroked; the card paints over the rest.
  pointerUp: { borderTopWidth: 1, borderLeftWidth: 1, marginBottom: -8 },
  pointerDown: { borderBottomWidth: 1, borderRightWidth: 1, marginTop: -8 },
});
