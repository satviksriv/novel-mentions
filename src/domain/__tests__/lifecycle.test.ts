import { mentionStatusSchema, type MentionStatus } from '../enums';
import { applyAction, canApply, nextStatus, type MentionAction } from '../lifecycle';
import { mentionSchema, type Mention } from '../mention';
import { validMention } from './fixtures';

const ACTIONS: MentionAction[] = ['submit', 'approve', 'reject', 'revise'];

/** The only legal (status → action → status) edges. */
const LEGAL: Record<string, MentionStatus> = {
  'personal:submit': 'pendingReview',
  'pendingReview:approve': 'published',
  'pendingReview:reject': 'rejected',
  'rejected:revise': 'personal',
};

const mentionIn = (status: MentionStatus, rejectionReason: string | null = null): Mention =>
  mentionSchema.parse({ ...validMention, status, rejectionReason });

describe('mention lifecycle machine', () => {
  it('canApply agrees with the legal edge set for every status/action pair', () => {
    for (const status of mentionStatusSchema.options) {
      for (const action of ACTIONS) {
        const legal = `${status}:${action}` in LEGAL;
        expect(canApply(status, action)).toBe(legal);
      }
    }
  });

  it('nextStatus returns the target for legal edges', () => {
    for (const [edge, target] of Object.entries(LEGAL)) {
      const [status, action] = edge.split(':') as [MentionStatus, MentionAction];
      expect(nextStatus(status, action)).toBe(target);
    }
  });

  it('nextStatus throws on an illegal transition', () => {
    expect(() => nextStatus('published', 'submit')).toThrow(/Cannot "submit"/);
    expect(() => nextStatus('personal', 'approve')).toThrow();
  });
});

describe('applyAction', () => {
  it('submit moves personal → pendingReview and clears any reason', () => {
    const result = applyAction(mentionIn('personal', 'old reason'), 'submit');
    expect(result.status).toBe('pendingReview');
    expect(result.rejectionReason).toBeNull();
  });

  it('reject records the reviewer reason', () => {
    const result = applyAction(mentionIn('pendingReview'), 'reject', { reason: 'Not in this book.' });
    expect(result.status).toBe('rejected');
    expect(result.rejectionReason).toBe('Not in this book.');
  });

  it('revise keeps the reason so the edit form can pin it', () => {
    const result = applyAction(mentionIn('rejected', 'Wrong chapter.'), 'revise');
    expect(result.status).toBe('personal');
    expect(result.rejectionReason).toBe('Wrong chapter.');
  });

  it('approve moves pendingReview → published and clears any reason', () => {
    const result = applyAction(mentionIn('pendingReview', 'stale'), 'approve');
    expect(result.status).toBe('published');
    expect(result.rejectionReason).toBeNull();
  });

  it('does not mutate the input mention', () => {
    const input = mentionIn('personal');
    applyAction(input, 'submit');
    expect(input.status).toBe('personal');
  });

  it('throws when the action is illegal for the current status', () => {
    expect(() => applyAction(mentionIn('published'), 'reject')).toThrow();
  });
});
