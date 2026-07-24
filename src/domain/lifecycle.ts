/**
 * Mention lifecycle — the state machine that governs status transitions.
 *
 *   personal ──submit──► pendingReview ──approve──► published
 *      ▲                       │
 *      └───── revise ◄── rejected ◄── reject
 *
 * In the MVP everything left of `published` is local — "submit" just flips the
 * status; the real review queue arrives with the Phase-2 backend. Seed content
 * (curated/AI) is created already `published` and never walks this machine.
 */
import type { MentionStatus } from './enums';
import type { Mention } from './mention';

export type MentionAction = 'submit' | 'approve' | 'reject' | 'revise';

const TRANSITIONS = {
  personal: { submit: 'pendingReview' },
  pendingReview: { approve: 'published', reject: 'rejected' },
  rejected: { revise: 'personal' },
  published: {},
} as const satisfies Record<MentionStatus, Partial<Record<MentionAction, MentionStatus>>>;

/** Whether `action` is legal from `status`. */
export function canApply(status: MentionStatus, action: MentionAction): boolean {
  return action in TRANSITIONS[status];
}

/** The status `action` leads to, or throws if the transition is illegal. */
export function nextStatus(status: MentionStatus, action: MentionAction): MentionStatus {
  const to = (TRANSITIONS[status] as Partial<Record<MentionAction, MentionStatus>>)[action];
  if (!to) throw new Error(`Cannot "${action}" a mention in status "${status}"`);
  return to;
}

export interface ApplyOptions {
  /** Reviewer's reason — used when rejecting. */
  readonly reason?: string;
}

/**
 * Return a new mention with `action` applied. Manages `rejectionReason`:
 * set on reject, kept through revise (so the edit form can show it), and
 * cleared on a fresh submit/approve. Throws on an illegal transition.
 */
export function applyAction(mention: Mention, action: MentionAction, opts: ApplyOptions = {}): Mention {
  const status = nextStatus(mention.status, action);
  switch (action) {
    case 'reject':
      return { ...mention, status, rejectionReason: opts.reason ?? mention.rejectionReason };
    case 'revise':
      return { ...mention, status }; // keep the reason so it can be pinned while editing
    case 'submit':
    case 'approve':
      return { ...mention, status, rejectionReason: null };
  }
}
