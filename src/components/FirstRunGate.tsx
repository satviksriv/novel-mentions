/**
 * FirstRunGate — decides whether a launch starts in the welcome pager (handoff
 * O1) or straight in the app, and owns the splash hand-off.
 *
 * It sits inside the repositories provider (it needs to read `welcomeSeen`) and
 * wraps the navigator. The splash stays up until the flag resolves, so a
 * returning reader never sees the Library flash behind a pager that's about to
 * cover it — and a first-time reader never sees it at all.
 *
 * Marking the flag is this component's job, not the pager's: the pager is reused
 * by the Library's "How Novel Mentions works" replay, which must not re-persist
 * anything.
 */
import { useCallback, useEffect, useState } from 'react';

import { useStarterShelf } from '@/hooks/use-starter-shelf';
import { useAsync } from '@/hooks/use-async';
import { useRepositories } from '@/repositories';

import { WelcomePager } from './WelcomePager';

export function FirstRunGate({
  onReady,
  children,
}: {
  /** Called once the gate knows what to show — the cue to hide the splash. */
  onReady: () => void;
  children: React.ReactNode;
}) {
  const repos = useRepositories();

  // A failed read resolves to `undefined`, which we treat as "not yet seen" —
  // re-showing the welcome is harmless; silently swallowing it is not.
  const { data: flags, loading } = useAsync(() => repos.uiState.flags(), [repos]);
  const [showWelcome, setShowWelcome] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (loading || settled) return;
    setShowWelcome(!flags?.welcomeSeen);
    setSettled(true);
  }, [loading, settled, flags]);

  // Only load beat 3's art when it's actually going to be shown.
  const { starters } = useStarterShelf(showWelcome);

  useEffect(() => {
    if (settled) onReady();
  }, [settled, onReady]);

  const finish = useCallback(() => {
    setShowWelcome(false);
    void repos.uiState.markSeen('welcomeSeen');
  }, [repos]);

  // Hold the tree back until the flag is known, so nothing renders behind the pager.
  if (!settled) return null;

  if (showWelcome) {
    return <WelcomePager starters={starters} onDone={finish} />;
  }

  return <>{children}</>;
}
