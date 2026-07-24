/**
 * Kind presentation — the single source for how the six mention kinds render:
 * their icon glyph, their singular badge label ("SONG"), and their plural
 * filter label ("Songs"). Colours live in the theme (KIND_COLORS); this maps
 * kinds to icons and words. Shared by Library chips, Book-detail tiles, and the
 * mention-detail / log-a-mention surfaces to come.
 */
import type { ComponentProps } from 'react';
import type Ionicons from '@expo/vector-icons/Ionicons';

import type { MentionKind } from '@/domain';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface KindMeta {
  /** Ionicons glyph. */
  readonly icon: IoniconName;
  /** Uppercased in the badge type preset; stored title-case. e.g. "Song". */
  readonly singular: string;
  /** Filter-chip / count label. e.g. "Songs". */
  readonly plural: string;
}

export const KIND_META: Record<MentionKind, KindMeta> = {
  song: { icon: 'musical-notes', singular: 'Song', plural: 'Songs' },
  movie: { icon: 'film', singular: 'Movie', plural: 'Movies' },
  quote: { icon: 'chatbubble-ellipses', singular: 'Quote', plural: 'Quotes' },
  book: { icon: 'book', singular: 'Book', plural: 'Books' },
  place: { icon: 'location', singular: 'Place', plural: 'Places' },
  other: { icon: 'ellipsis-horizontal-circle', singular: 'Other', plural: 'Other' },
};

/** Canonical kind order (matches the token tables and the log-a-mention selector). */
export const KIND_ORDER: readonly MentionKind[] = [
  'song',
  'movie',
  'quote',
  'book',
  'place',
  'other',
];
