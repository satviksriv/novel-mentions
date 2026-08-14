/**
 * UiStateRepository — the reader's one-shot UI cues (onboarding handoff O1/O3).
 *
 * Three flags: `welcomeSeen` (the welcome pager has run), `libraryTipSeen` and
 * `fabTipSeen` (the two coach-marks). Screens read them through here rather than
 * touching the store, same as every other read path.
 *
 * These are cues, not content: nothing here touches books, mentions, or notes,
 * and clearing them only makes the app re-teach itself.
 */
import { NO_FLAGS_SEEN, type LocalStore, type UiFlag, type UiFlags } from '@/data/local/local-store';

export class UiStateRepository {
  constructor(private readonly local: LocalStore) {}

  /** Every flag, with unset ones reported as false. */
  flags(): Promise<UiFlags> {
    return this.local.getUiFlags();
  }

  /**
   * Mark one cue as seen. Read-modify-write on the whole set, which is safe here
   * because cues are only ever marked from user gestures — one at a time, and
   * the spec shows at most one coach-mark at once.
   */
  async markSeen(flag: UiFlag): Promise<UiFlags> {
    const flags = await this.local.getUiFlags();
    if (flags[flag]) return flags;
    const next = { ...flags, [flag]: true };
    await this.local.saveUiFlags(next);
    return next;
  }

  /**
   * Clear every cue, so the next launch onboards from scratch. The QA reset the
   * handoff asks for; wired to a dev-only affordance, never a user-facing one.
   */
  async resetAll(): Promise<UiFlags> {
    const cleared = { ...NO_FLAGS_SEEN };
    await this.local.saveUiFlags(cleared);
    return cleared;
  }
}
