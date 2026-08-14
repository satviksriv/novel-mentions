import { InMemoryLocalStore, type InitialLocalData } from '@/data/local/in-memory-store';

import { UiStateRepository } from '../ui-state-repository';

const makeRepo = (initial?: InitialLocalData) => {
  const local = new InMemoryLocalStore(initial);
  return { repo: new UiStateRepository(local), local };
};

describe('UiStateRepository', () => {
  it('reports every cue unseen on a fresh install', async () => {
    const { repo } = makeRepo();
    expect(await repo.flags()).toEqual({
      welcomeSeen: false,
      libraryTipSeen: false,
      fabTipSeen: false,
    });
  });

  it('marks one cue seen without disturbing the others', async () => {
    const { repo } = makeRepo();
    const after = await repo.markSeen('welcomeSeen');

    expect(after.welcomeSeen).toBe(true);
    expect(after.libraryTipSeen).toBe(false);
    expect(after.fabTipSeen).toBe(false);
    // Persisted, not just returned.
    expect(await repo.flags()).toEqual(after);
  });

  it('accumulates across separate marks', async () => {
    const { repo } = makeRepo();
    await repo.markSeen('welcomeSeen');
    await repo.markSeen('fabTipSeen');

    expect(await repo.flags()).toEqual({
      welcomeSeen: true,
      libraryTipSeen: false,
      fabTipSeen: true,
    });
  });

  it('is idempotent — re-marking a seen cue is a no-op', async () => {
    const { repo } = makeRepo({ uiFlags: { libraryTipSeen: true } });
    expect(await repo.markSeen('libraryTipSeen')).toEqual(await repo.flags());
    expect((await repo.flags()).libraryTipSeen).toBe(true);
  });

  it('honours flags seeded from storage', async () => {
    const { repo } = makeRepo({ uiFlags: { welcomeSeen: true } });
    const flags = await repo.flags();
    expect(flags.welcomeSeen).toBe(true);
    expect(flags.fabTipSeen).toBe(false);
  });

  it('resetAll clears every cue so onboarding replays', async () => {
    const { repo } = makeRepo({
      uiFlags: { welcomeSeen: true, libraryTipSeen: true, fabTipSeen: true },
    });

    expect(await repo.resetAll()).toEqual({
      welcomeSeen: false,
      libraryTipSeen: false,
      fabTipSeen: false,
    });
    expect(await repo.flags()).toEqual(await repo.resetAll());
  });
});
