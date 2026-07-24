/**
 * Status presentation — the single source for how the four mention lifecycle
 * statuses read in the UI. Colours live in the theme (STATUS_COLORS, keyed to
 * the same values); this maps statuses to their badge copy. Note the domain
 * value `pendingReview` shows as "Pending" (handoff Addendum). Shared by the
 * mention-detail owner badge and the My-stuff rows to come.
 */
import type { MentionStatus } from '@/domain';

export const STATUS_META: Record<MentionStatus, { readonly label: string }> = {
  personal: { label: 'Personal' },
  pendingReview: { label: 'Pending' },
  published: { label: 'Published' },
  rejected: { label: 'Rejected' },
};
