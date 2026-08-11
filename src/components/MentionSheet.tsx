/**
 * MentionSheet — the shared log/edit bottom-sheet form (design handoff §4).
 * Creates a new user mention or edits an existing one; also the resubmit
 * surface for a rejected mention (revise → submit, with the reviewer's-reason
 * banner pinned on top). Built on RN's own Modal — no native deps, Expo Go safe.
 *
 * Presented from the Book-detail FAB (create, kind defaults to the active
 * filter), the Mention-detail Edit action (edit), and the My-stuff empty-state
 * CTA (create). It talks to the repository itself and reports the saved
 * mention via onSaved so the host screen can refresh.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EXCERPT_MAX_LENGTH, type Mention, type MentionKind } from '@/domain';
import { useRepositories } from '@/repositories';
import { useTheme } from '@/theme';
import { KIND_META, KIND_ORDER } from '@/ui/kind';

export function MentionSheet({
  bookId,
  initial,
  defaultKind,
  onClose,
  onSaved,
}: {
  bookId: string;
  /** Present ⇒ edit mode (prefilled). Absent ⇒ create. */
  initial?: Mention;
  /** Create-mode default (Book-detail passes the active filter kind). */
  defaultKind?: MentionKind;
  onClose: () => void;
  onSaved: (mention: Mention) => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const repos = useRepositories();

  const isEdit = initial !== undefined;
  const isRejected = initial?.status === 'rejected';

  const [kind, setKind] = useState<MentionKind>(initial?.kind ?? defaultKind ?? 'song');
  const [title, setTitle] = useState(initial?.title ?? '');
  const [attribution, setAttribution] = useState(initial?.attribution ?? '');
  const [chapter, setChapter] = useState(initial?.chapter ?? '');
  const [page, setPage] = useState(initial?.pageHint ? String(initial.pageHint.page) : '');
  const [edition, setEdition] = useState(initial?.pageHint?.edition ?? '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [why, setWhy] = useState(initial?.whyMentioned ?? '');
  const [character, setCharacter] = useState(initial?.characterContext ?? '');
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && chapter.trim().length > 0 && why.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const pageHint =
        page.trim() && edition.trim() ? { page: page.trim(), edition: edition.trim() } : null;
      const fields = {
        kind,
        title: title.trim(),
        attribution: attribution.trim() || null,
        chapter: chapter.trim(),
        pageHint,
        excerpt: excerpt.trim() || null,
        whyMentioned: why.trim(),
        characterContext: character.trim() || null,
      };
      let saved: Mention;
      if (initial) {
        saved = await repos.mentions.update(initial.id, fields);
        // Rejected → resubmit: revise back to personal, then submit to pending.
        if (isRejected) {
          await repos.mentions.applyLifecycle(initial.id, 'revise');
          saved = await repos.mentions.applyLifecycle(initial.id, 'submit');
        }
      } else {
        saved = await repos.mentions.create({
          bookId,
          ...fields,
          chapterOrder: null,
          positionHint: null,
          contextSubject: null,
          externalUrl: null,
        });
      }
      onSaved(saved);
    } finally {
      setSaving(false);
    }
  };

  const saveLabel = isRejected ? 'Resubmit' : 'Save';

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
            <Text style={[t.type.rowTitle, { color: t.color.text }]}>
              {isEdit ? 'Edit mention' : 'Log a mention'}
            </Text>
            <Pressable onPress={handleSave} hitSlop={8} disabled={!canSave}>
              <Text
                style={[
                  t.type.rowTitle,
                  { color: canSave ? (isRejected ? t.status.rejected.solid : t.color.text) : t.color.text3 },
                ]}
              >
                {saveLabel}
              </Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: t.spacing.lg, paddingVertical: t.spacing.md }}
          >
            {isRejected && initial?.rejectionReason && (
              <View
                style={[
                  styles.banner,
                  { backgroundColor: t.status.rejected.soft, borderLeftColor: t.status.rejected.solid },
                ]}
              >
                <View style={styles.bannerHead}>
                  <Ionicons name="alert-circle" size={14} color={t.status.rejected.solid} />
                  <Text style={[t.type.label, { color: t.status.rejected.solid }]}>Reviewer&apos;s reason</Text>
                </View>
                <Text style={[t.type.body, { color: t.color.text }]}>{initial.rejectionReason}</Text>
              </View>
            )}

            {/* Kind selector. */}
            <View style={[styles.segTrack, { backgroundColor: t.color.surface2 }]}>
              {KIND_ORDER.map((k) => {
                const active = k === kind;
                const kc = t.kind[k];
                return (
                  <Pressable
                    key={k}
                    onPress={() => setKind(k)}
                    style={[
                      styles.seg,
                      active && { backgroundColor: t.color.surface, boxShadow: t.shadow.card },
                    ]}
                  >
                    <Ionicons name={KIND_META[k].icon} size={16} color={active ? kc.solid : t.color.text3} />
                    <Text
                      style={[styles.segLabel, { fontFamily: t.font.sansSemiBold, color: active ? kc.solid : t.color.text3 }]}
                    >
                      {KIND_META[k].singular}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[t.type.secondary, { color: t.color.text3 }]}>
              <Text style={{ color: t.color.text2, fontFamily: t.font.sansBold }}>*</Text> Required to save
            </Text>

            <Field label="Title" value={title} onChangeText={setTitle} placeholder="What was mentioned?" required />
            <Field
              label="Attribution"
              value={attribution}
              onChangeText={setAttribution}
              placeholder="Artist, director, speaker…"
            />
            <Field
              label="Chapter / part"
              value={chapter}
              onChangeText={setChapter}
              placeholder="e.g. Chapter 3"
              required
            />
            <View style={styles.twoUp}>
              <View style={styles.half}>
                <Field label="Page" value={page} onChangeText={setPage} placeholder="27" keyboardType="numbers-and-punctuation" />
              </View>
              <View style={styles.half}>
                <Field label="Edition" value={edition} onChangeText={setEdition} placeholder="2012 ed." />
              </View>
            </View>
            <Field
              label="Short excerpt"
              value={excerpt}
              onChangeText={setExcerpt}
              placeholder="A sentence or two (kept short)."
              multiline
              maxLength={EXCERPT_MAX_LENGTH}
            />
            <Field
              label="Why it's mentioned"
              value={why}
              onChangeText={setWhy}
              placeholder="What it adds to the moment."
              multiline
              required
            />
            <Field
              label="Character context"
              value={character}
              onChangeText={setCharacter}
              placeholder="What the character / author was thinking."
              multiline
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({
  label,
  required,
  multiline,
  ...input
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  /** Marks the label with a * so the reader can see it's needed to save. */
  required?: boolean;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: 'numbers-and-punctuation';
}) {
  const t = useTheme();
  return (
    <View style={{ gap: t.spacing.xs }}>
      <Text style={[t.type.label, { color: t.color.text2 }]}>
        {label}
        {required && <Text style={{ color: t.color.text }}> *</Text>}
      </Text>
      <TextInput
        placeholderTextColor={t.color.text3}
        multiline={multiline}
        style={[
          styles.input,
          {
            color: t.color.text,
            backgroundColor: t.color.bg,
            borderColor: t.color.border,
            borderRadius: t.radius.input,
            fontFamily: t.font.sans,
            minHeight: multiline ? 72 : 44,
            textAlignVertical: multiline ? 'top' : 'center',
          },
        ]}
        {...input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(12,8,3,0.5)' },
  sheet: { maxHeight: '90%', paddingHorizontal: 20, paddingTop: 10, gap: 6 },
  grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  banner: { padding: 12, borderLeftWidth: 3, borderRadius: 12, gap: 6 },
  bannerHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  segTrack: { flexDirection: 'row', borderRadius: 14, padding: 5, gap: 4 },
  seg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 8,
    borderRadius: 10,
  },
  segLabel: { fontSize: 10 },
  twoUp: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  input: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14.5 },
});
