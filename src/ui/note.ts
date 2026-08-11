/**
 * Note presentation helpers. Pure — no theme/hooks, so they're unit-testable.
 */

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

/** Note meta line, e.g. "You · Jan 4". Formatted without Intl for determinism. */
export function noteMeta(iso: string): string {
  const d = new Date(iso);
  return `You · ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}
