import { InMemoryLocalStore } from '@/data/local/in-memory-store';
import { SeedSource } from '@/data/seed/source';

import { MentionRepository } from '../mention-repository';
import { draftFor, makeTestDeps, RecordingRemote } from './helpers';

const seed = new SeedSource();
const [perks, gatsby] = seed.books();

function makeRepo(local = new InMemoryLocalStore(), remote = new RecordingRemote()) {
  const repo = new MentionRepository(seed, local, remote, makeTestDeps());
  return { repo, local, remote };
}

describe('MentionRepository.forBook (merge + order)', () => {
  it('merges seed and the reader\'s own mentions, in reading order', async () => {
    const { repo } = makeRepo();
    await repo.create(draftFor(gatsby.id, { title: 'Aaa earliest', chapterOrder: 1 }));

    const merged = await repo.forBook(gatsby.id);
    expect(merged.length).toBe(seed.mentionsForBook(gatsby.id).length + 1);
    // chapterOrder 1, title "Aaa…" sorts ahead of the seed's order-1 entry.
    expect(merged[0].title).toBe('Aaa earliest');
    const orders = merged.map((m) => m.chapterOrder ?? Infinity);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('does not include the reader\'s mentions from other books', async () => {
    const { repo } = makeRepo();
    await repo.create(draftFor(perks.id, { title: 'Only in Perks' }));

    const gatsbyMentions = await repo.forBook(gatsby.id);
    expect(gatsbyMentions.some((m) => m.title === 'Only in Perks')).toBe(false);
    expect((await repo.forBook(perks.id)).some((m) => m.title === 'Only in Perks')).toBe(true);
  });
});

describe('MentionRepository create / update / remove', () => {
  it('creates a personal, user-sourced mention and stores it', async () => {
    const { repo, local } = makeRepo();
    const created = await repo.create(draftFor(gatsby.id));

    expect(created.source).toBe('user');
    expect(created.status).toBe('personal');
    expect(created.contributorRef).toBeNull();
    expect(await repo.getById(created.id)).toEqual(created);
    expect(await local.getUserMentions()).toHaveLength(1);
  });

  it('rejects an invalid draft (empty whyMentioned)', async () => {
    const { repo } = makeRepo();
    await expect(repo.create(draftFor(gatsby.id, { whyMentioned: '' }))).rejects.toThrow();
  });

  it('updates the reader\'s own mention', async () => {
    const { repo } = makeRepo();
    const created = await repo.create(draftFor(gatsby.id));
    const updated = await repo.update(created.id, { title: 'Edited title' });
    expect(updated.title).toBe('Edited title');
    expect((await repo.getById(created.id))?.title).toBe('Edited title');
  });

  it('refuses to mutate seed content or unknown ids', async () => {
    const { repo } = makeRepo();
    const seedId = seed.mentionsForBook(gatsby.id)[0].id;
    await expect(repo.update(seedId, { title: 'nope' })).rejects.toThrow();
    await expect(repo.remove(seedId)).rejects.toThrow();
    await expect(repo.remove('00000000-0000-4000-8000-0000000000ff')).rejects.toThrow();
  });

  it('removes the reader\'s own mention', async () => {
    const { repo, local } = makeRepo();
    const created = await repo.create(draftFor(gatsby.id));
    await repo.remove(created.id);
    expect(await local.getUserMentions()).toHaveLength(0);
  });
});

describe('MentionRepository.applyLifecycle', () => {
  it('walks personal → pendingReview → rejected → personal → pendingReview', async () => {
    const { repo, remote } = makeRepo();
    const created = await repo.create(draftFor(gatsby.id));

    const submitted = await repo.applyLifecycle(created.id, 'submit');
    expect(submitted.status).toBe('pendingReview');
    expect(remote.submitted).toHaveLength(1);
    expect(remote.submitted[0].id).toBe(created.id);

    const rejected = await repo.applyLifecycle(created.id, 'reject', { reason: 'needs a source' });
    expect(rejected.status).toBe('rejected');
    expect(rejected.rejectionReason).toBe('needs a source');

    const revised = await repo.applyLifecycle(created.id, 'revise');
    expect(revised.status).toBe('personal');
    expect(revised.rejectionReason).toBe('needs a source'); // kept for the edit form

    const resubmitted = await repo.applyLifecycle(created.id, 'submit');
    expect(resubmitted.status).toBe('pendingReview');
    expect(resubmitted.rejectionReason).toBeNull(); // cleared on a fresh submit
  });

  it('throws on an illegal transition and on seed content', async () => {
    const { repo } = makeRepo();
    const created = await repo.create(draftFor(gatsby.id));
    await expect(repo.applyLifecycle(created.id, 'approve')).rejects.toThrow();

    const seedId = seed.mentionsForBook(gatsby.id)[0].id;
    await expect(repo.applyLifecycle(seedId, 'submit')).rejects.toThrow();
  });
});
