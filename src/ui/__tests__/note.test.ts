import { noteMeta } from '../note';

describe('noteMeta', () => {
  // Build the ISO input from a *local* date so the assertion holds in any
  // timezone: noteMeta reads the local calendar date, matching what the reader
  // sees ("today"). Times are kept away from midnight to avoid DST edges.
  const iso = (y: number, monthIndex: number, day: number) =>
    new Date(y, monthIndex, day, 9, 30).toISOString();

  it('formats a timestamp as "You · Mon D"', () => {
    expect(noteMeta(iso(2026, 0, 4))).toBe('You · Jan 4');
    expect(noteMeta(iso(2026, 7, 12))).toBe('You · Aug 12');
    expect(noteMeta(iso(2026, 11, 31))).toBe('You · Dec 31');
  });
});
