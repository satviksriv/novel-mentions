/**
 * WelcomePager — the first-run welcome (onboarding handoff O1).
 *
 * Three horizontally-paged beats: what the app is → what you can do → the
 * starter shelf. Deliberately not a full carousel: the rest of the app is taught
 * in place by the coach-marks (O3), so these three only orient the reader.
 *
 * Beats 1–2 carry a Skip; beat 3's "Open the Library." CTA is its own exit.
 * Either way the host marks `welcomeSeen` — this component reports the exit via
 * onDone and owns no persistence itself, which is also what lets the Library
 * ⋯ menu replay it (O4) without re-running first-launch logic.
 *
 * Beat 3 shows the real bundled books (cover, palette, mention counts) rather
 * than a mock, so the "these came with the app" framing points at the same cards
 * the reader is about to meet in the Library.
 */
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Book } from '@/domain';
import { useTheme } from '@/theme';
import type { KindCount } from '@/ui/derive';
import { KIND_ORDER } from '@/ui/kind';

import { BookCover } from './BookCover';
import { CountChip, KindChip } from './Chips';

/** A bundled book plus its per-kind counts, for the beat-3 starter shelf. */
export interface StarterBook {
  book: Book;
  counts: KindCount[];
}

const BEAT_COUNT = 3;

export function WelcomePager({
  starters,
  onDone,
}: {
  /** The bundled books. Empty is tolerated — beat 3 simply drops its art. */
  starters: readonly StarterBook[];
  onDone: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scroller = useRef<ScrollView>(null);
  const [beat, setBeat] = useState(0);

  const isLast = beat === BEAT_COUNT - 1;

  const goTo = (index: number) => {
    scroller.current?.scrollTo({ x: index * width, animated: true });
    setBeat(index);
  };

  // Page index from the scroll offset, so swiping and the → button stay in sync.
  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== beat) setBeat(next);
  };

  return (
    <View style={[styles.fill, { backgroundColor: t.color.bg, paddingTop: insets.top }]}>
      {/* Skip — beats 1–2 only; beat 3's CTA is the exit. */}
      <View style={[styles.skipRow, { paddingHorizontal: 24 }]}>
        {!isLast && (
          <Pressable onPress={onDone} hitSlop={16} accessibilityRole="button">
            <Text style={{ fontFamily: t.font.sansSemiBold, fontSize: 14, color: t.color.text2 }}>
              Skip
            </Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumEnd}
        style={styles.fill}
      >
        <Beat
          width={width}
          eyebrow="Welcome"
          title="Every reference, catalogued."
          body="Novel Mentions collects the songs, films, quotes, books and places an author reaches for — where each one lands, and why it's there."
          art={<KindChipsArt />}
        />
        <Beat
          width={width}
          eyebrow="Yours to build on"
          title="Read closer. Keep notes."
          body="Three things you can do from here."
          art={<FeaturesArt />}
        />
        <Beat
          width={width}
          eyebrow="On us"
          title="Two books to start with."
          body="These came with the app, already catalogued, so there's something to explore right away. Add your own whenever you like."
          art={<StarterShelfArt starters={starters} />}
        />
      </ScrollView>

      {/* Footer — dots + advance, or the beat-3 CTA. */}
      <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 30, gap: 18 }}>
        {isLast ? (
          <View style={{ gap: 10 }}>
            <Pressable
              onPress={onDone}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.cta,
                { backgroundColor: t.color.accentInk, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={{ fontFamily: t.font.sansBold, fontSize: 15, color: t.color.bg }}>
                Open the Library.
              </Text>
            </Pressable>
            <View style={styles.footnote}>
              <Ionicons name="lock-closed-outline" size={12} color={t.color.text3} />
              <Text style={[t.type.secondary, { color: t.color.text3 }]}>
                Everything stays on your device. No account, nothing to sign up for.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.footerRow}>
            <Dots count={BEAT_COUNT} active={beat} />
            <Pressable
              onPress={() => goTo(beat + 1)}
              accessibilityRole="button"
              accessibilityLabel="Next"
              style={({ pressed }) => [
                styles.advance,
                { backgroundColor: t.color.accentInk, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Ionicons name="arrow-forward" size={22} color={t.color.bg} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

function Beat({
  width,
  eyebrow,
  title,
  body,
  art,
}: {
  width: number;
  eyebrow: string;
  title: string;
  body: string;
  art: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View style={[styles.beat, { width, paddingHorizontal: 24 }]}>
      <View style={styles.art}>{art}</View>
      <View style={{ gap: 10 }}>
        <Text style={[t.type.label, styles.eyebrow, { color: t.color.text3 }]}>{eyebrow}</Text>
        <Text style={[t.type.screenTitle, styles.beatTitle, { color: t.color.text }]}>{title}</Text>
        <Text style={[styles.beatBody, { fontFamily: t.font.sans, color: t.color.text2 }]}>
          {body}
        </Text>
      </View>
    </View>
  );
}

/** Beat 1 — the six kind chips, where the colour language is introduced. */
function KindChipsArt() {
  return (
    <View style={styles.chipCloud}>
      {KIND_ORDER.map((kind) => (
        <KindChip key={kind} kind={kind} />
      ))}
    </View>
  );
}

const FEATURES = [
  {
    icon: 'book-outline',
    title: 'Browse curated mentions',
    body: 'Every reference in reading order, grouped by chapter, filterable by kind.',
  },
  {
    icon: 'create-outline',
    title: 'Keep private notes',
    body: 'On a single mention, or on a whole book. Only you ever see them.',
  },
  {
    icon: 'add-circle-outline',
    title: 'Log what you spot — and add books',
    body: 'Catch a reference we missed? Log it. Add any book to build your own library.',
  },
] as const satisfies readonly {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body: string;
}[];

/** Beat 2 — three feature rows. Tiles stay neutral so they don't compete with beat 1. */
function FeaturesArt() {
  const t = useTheme();
  return (
    <View style={{ gap: 22, width: '100%' }}>
      {FEATURES.map((f) => (
        <View key={f.title} style={styles.featureRow}>
          <View style={[styles.featureTile, { backgroundColor: t.color.surface2 }]}>
            <Ionicons name={f.icon} size={22} color={t.color.text} />
          </View>
          <View style={styles.featureBody}>
            <Text style={{ fontFamily: t.font.sansSemiBold, fontSize: 16, color: t.color.text }}>
              {f.title}
            </Text>
            <Text style={[styles.featureDesc, { fontFamily: t.font.sans, color: t.color.text2 }]}>
              {f.body}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/** Beat 3 — the bundled covers, each tagged "Included", with their count chips. */
function StarterShelfArt({ starters }: { starters: readonly StarterBook[] }) {
  return (
    <View style={styles.shelf}>
      {starters.map(({ book, counts }) => (
        <View key={book.id} style={styles.shelfItem}>
          <View>
            <BookCover book={book} size="welcome" />
            {/* On-cover overlay, same family as the handoff's `cover.img` tag —
                a fixed ink-on-white chip, not a themed token. */}
            <View style={styles.includedOverlay}>
              <Text style={styles.includedOverlayText}>Included</Text>
            </View>
          </View>
          <View style={styles.shelfChips}>
            {counts.slice(0, 3).map(({ kind, count }) => (
              <CountChip key={kind} kind={kind} count={count} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

function Dots({ count, active }: { count: number; active: number }) {
  const t = useTheme();
  return (
    <View style={styles.dots}>
      {Array.from({ length: count }, (_, i) =>
        i === active ? (
          <View key={i} style={[styles.dotActive, { backgroundColor: t.color.accentInk }]} />
        ) : (
          <View key={i} style={[styles.dot, { backgroundColor: t.color.text3 }]} />
        ),
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  skipRow: { height: 32, alignItems: 'flex-end', justifyContent: 'center', paddingTop: 8 },
  beat: { flex: 1, justifyContent: 'center', gap: 24 },
  art: { alignItems: 'center', justifyContent: 'center', minHeight: 220 },
  eyebrow: { fontSize: 12, letterSpacing: 1.68 },
  // line-height 1.05 and -0.01em tracking per O1; the size/family come from the
  // shared screen-title preset.
  beatTitle: { lineHeight: 31.5, letterSpacing: -0.3 },
  beatBody: { fontSize: 15.5, lineHeight: 24 },
  chipCloud: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  featureTile: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  featureBody: { flex: 1, gap: 3 },
  featureDesc: { fontSize: 13.5, lineHeight: 19.5 },
  shelf: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  shelfItem: { gap: 8, alignItems: 'center' },
  shelfChips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5 },
  includedOverlay: {
    position: 'absolute',
    top: 7,
    left: 7,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  includedOverlayText: {
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: '#3A2F22',
  },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 3.5, opacity: 0.45 },
  dotActive: { width: 22, height: 7, borderRadius: 4 },
  advance: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  cta: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  footnote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
});
