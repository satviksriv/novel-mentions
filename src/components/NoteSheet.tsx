/**
 * NoteSheet — the reader's private note editor bottom-sheet (design handoff
 * "Additional states" → note editor). A tall plain-text textarea with a
 * "Private to you · plain text" hint; notes carry no rich formatting.
 *
 * Shared by Mention detail (a note on one mention) and Book detail (a note on
 * the whole book, handoff A4). The host owns persistence — the sheet only
 * collects the body and hands it back via onSave; passing `initial` prefills
 * it for editing. Built on RN's own Modal — no native deps, Expo Go safe.
 */
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export function NoteSheet({
  initial,
  title = 'Your note',
  onSave,
  onClose,
}: {
  /** Present ⇒ edit (prefilled); absent ⇒ add. */
  initial?: string;
  /** Sheet header label (defaults to "Your note"). */
  title?: string;
  onSave: (body: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [body, setBody] = useState(initial ?? '');
  const [saving, setSaving] = useState(false);
  const canSave = body.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave(body.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.scrim}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: t.color.surface,
              borderTopLeftRadius: t.radius.sheet,
              borderTopRightRadius: t.radius.sheet,
              paddingBottom: insets.bottom + t.spacing.lg,
            },
          ]}
        >
          <View style={[styles.grabber, { backgroundColor: t.color.border }]} />
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={[t.type.rowTitle, { color: t.color.text2 }]}>Cancel</Text>
            </Pressable>
            <Text style={[t.type.rowTitle, { color: t.color.text }]}>{title}</Text>
            <Pressable onPress={handleSave} hitSlop={8} disabled={!canSave}>
              <Text style={[t.type.rowTitle, { color: canSave ? t.color.text : t.color.text3 }]}>Save</Text>
            </Pressable>
          </View>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Jot down a thought…"
            placeholderTextColor={t.color.text3}
            multiline
            autoFocus
            style={[
              styles.input,
              t.type.note,
              { color: t.color.text, backgroundColor: t.color.bg, borderColor: t.color.border, borderRadius: t.radius.input },
            ]}
          />
          <Text style={[t.type.secondary, { color: t.color.text3 }]}>Private to you · plain text</Text>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,8,3,0.5)' },
  sheet: { paddingHorizontal: 20, paddingTop: 10, gap: 14 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  input: { minHeight: 120, borderWidth: 1, padding: 12, textAlignVertical: 'top' },
});
