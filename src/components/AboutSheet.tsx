/**
 * AboutSheet — the Library ⋯ menu's "About Novel Mentions" destination (handoff
 * O4): what the app is, its version, and the local-only reassurance. Reuses the
 * standard bottom-sheet shell (scrim, grabber, header row) — with Close in place
 * of Cancel, since there's nothing here to discard.
 *
 * Version comes from expo-constants so it tracks app.json rather than drifting
 * in a hard-coded string.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRepositories } from '@/repositories';
import { useTheme } from '@/theme';

export function AboutSheet({ onClose }: { onClose: () => void }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepositories();
  const version = Constants.expoConfig?.version ?? '—';

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
              paddingBottom: insets.bottom + t.spacing.xl,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: t.color.border }]} />
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={[t.type.rowTitle, { color: t.color.text2 }]}>Close</Text>
            </Pressable>
            <Text style={[t.type.rowTitle, { color: t.color.text }]}>About</Text>
            {/* Balances the header row so the title stays optically centred. */}
            <View style={styles.headerSpacer} />
          </View>

          <View style={{ gap: t.spacing.md, paddingTop: t.spacing.sm }}>
            <Text style={[t.type.mentionTitle, { color: t.color.text, fontSize: 24 }]}>
              Novel Mentions
            </Text>
            <Text style={[t.type.body, { color: t.color.text2 }]}>
              Made for readers. For a novel or memoir, it catalogs the songs, films, quotes, books
              and places the author reaches for — where each one lands, and what it adds to the
              moment.
            </Text>
            <View style={[styles.note, { backgroundColor: t.color.surface2 }]}>
              <Ionicons name="lock-closed-outline" size={14} color={t.color.text2} />
              <Text style={[t.type.secondary, { color: t.color.text2, flex: 1 }]}>
                Your notes and the mentions you log stay on this device. No account, no sync.
              </Text>
            </View>
            <Text style={[t.type.secondary, { color: t.color.text3 }]}>Version {version}</Text>

            {/* QA affordance the handoff asks for. __DEV__-guarded, so it's
                stripped from a release bundle and can't reach a real reader. */}
            {__DEV__ && (
              <Pressable
                onPress={async () => {
                  await repos.uiState.resetAll();
                  Alert.alert(
                    'Onboarding reset',
                    'Reload the app to see the welcome and both tips again.',
                  );
                }}
                style={({ pressed }) => [
                  styles.devReset,
                  { borderColor: t.color.border, opacity: pressed ? 0.6 : 1 },
                ]}
              >
                <Ionicons name="refresh-outline" size={14} color={t.color.text2} />
                <Text style={[t.type.secondary, { color: t.color.text2 }]}>
                  Reset onboarding (dev only)
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,8,3,0.5)' },
  sheet: { paddingHorizontal: 20, paddingTop: 10, gap: 6 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  headerSpacer: { width: 44 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderRadius: 12 },
  devReset: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: 'dashed',
  },
});
