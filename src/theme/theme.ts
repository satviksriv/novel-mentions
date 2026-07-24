/**
 * Theme resolution — turns the mode-dependent {light,dark} tokens into a flat,
 * scheme-resolved Theme that screens consume via useTheme().
 */
import type { BookPaletteSource, MentionKind, MentionStatus, ModeValue } from '@/domain';

import {
  FONT_FAMILY,
  KIND_COLORS,
  NEUTRALS,
  RADIUS,
  SHADOW,
  SPACING,
  STATUS_COLORS,
  TYPE,
  type ColorScheme,
} from './tokens';

type ResolvedPair = { readonly solid: string; readonly soft: string };

export interface Theme {
  readonly scheme: ColorScheme;
  readonly color: {
    readonly bg: string;
    readonly surface: string;
    readonly surface2: string;
    readonly border: string;
    readonly line: string;
    readonly text: string;
    readonly text2: string;
    readonly text3: string;
    readonly accentInk: string;
  };
  readonly kind: Record<MentionKind, ResolvedPair>;
  readonly status: Record<MentionStatus, ResolvedPair>;
  readonly shadow: { readonly card: string };
  readonly spacing: typeof SPACING;
  readonly radius: typeof RADIUS;
  readonly type: typeof TYPE;
  readonly font: typeof FONT_FAMILY;
}

/** Book palette resolved for the active scheme. */
export interface BookPalette {
  readonly primary: string;
  readonly onHeader: string;
  readonly softTint: string;
  readonly coverGradient: readonly [string, string];
}

const pick = <T,>(v: ModeValue<T>, scheme: ColorScheme): T => v[scheme];

function resolvePairs<K extends string>(
  source: Record<K, { solid: ModeValue<string>; soft: ModeValue<string> }>,
  scheme: ColorScheme,
): Record<K, ResolvedPair> {
  const out = {} as Record<K, ResolvedPair>;
  for (const key of Object.keys(source) as K[]) {
    out[key] = { solid: pick(source[key].solid, scheme), soft: pick(source[key].soft, scheme) };
  }
  return out;
}

export function resolveTheme(scheme: ColorScheme): Theme {
  return {
    scheme,
    color: {
      bg: pick(NEUTRALS.bg, scheme),
      surface: pick(NEUTRALS.surface, scheme),
      surface2: pick(NEUTRALS.surface2, scheme),
      border: pick(NEUTRALS.border, scheme),
      line: pick(NEUTRALS.line, scheme),
      text: pick(NEUTRALS.text, scheme),
      text2: pick(NEUTRALS.text2, scheme),
      text3: pick(NEUTRALS.text3, scheme),
      accentInk: pick(NEUTRALS.accentInk, scheme),
    },
    kind: resolvePairs(KIND_COLORS, scheme),
    status: resolvePairs(STATUS_COLORS, scheme),
    shadow: { card: pick(SHADOW.card, scheme) },
    spacing: SPACING,
    radius: RADIUS,
    type: TYPE,
    font: FONT_FAMILY,
  };
}

/** Resolve a per-book palette source for the active scheme. on-header is always white. */
export function resolveBookPalette(source: BookPaletteSource, scheme: ColorScheme): BookPalette {
  return {
    primary: pick(source.primary, scheme),
    onHeader: '#FFFFFF',
    softTint: pick(source.softTint, scheme),
    coverGradient: source.coverGradient,
  };
}
