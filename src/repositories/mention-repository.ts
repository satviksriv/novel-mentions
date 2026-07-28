/**
 * MentionRepository — the heart of the read/write path. `forBook` merges a
 * book's published seed mentions with the reader's own local mentions for that
 * book; create/update/delete and the lifecycle all operate on user mentions
 * only (seed content is immutable). "Submit for review" runs the domain state
 * machine and hands the mention to the remote source (a no-op stub in MVP).
 */
import {
  applyAction,
  parseMention,
  type Mention,
  type MentionAction,
  type ApplyOptions,
} from '@/domain';
import type { LocalStore } from '@/data/local/local-store';
import type { RemoteContentSource } from '@/data/remote/remote-content-source';
import type { SeedSource } from '@/data/seed/source';

import type { RepoDeps } from './deps';

/** The authoring fields of a new mention; system fields are filled by create(). */
export type DraftMention = Pick<
  Mention,
  | 'bookId'
  | 'kind'
  | 'title'
  | 'attribution'
  | 'chapter'
  | 'chapterOrder'
  | 'positionHint'
  | 'pageHint'
  | 'excerpt'
  | 'whyMentioned'
  | 'characterContext'
  | 'contextSubject'
  | 'externalUrl'
>;

/** Editable fields on an existing user mention. */
export type MentionPatch = Partial<Omit<DraftMention, 'bookId'>>;

/** Reading order: by chapter, then title; unordered chapters sort last. */
function byReadingOrder(a: Mention, b: Mention): number {
  const ao = a.chapterOrder ?? Number.POSITIVE_INFINITY;
  const bo = b.chapterOrder ?? Number.POSITIVE_INFINITY;
  if (ao !== bo) return ao - bo;
  return a.title.localeCompare(b.title);
}

export class MentionRepository {
  constructor(
    private readonly seed: SeedSource,
    private readonly local: LocalStore,
    private readonly remote: RemoteContentSource,
    private readonly deps: RepoDeps,
  ) {}

  /** Published seed mentions + the reader's own mentions for this book, in reading order. */
  async forBook(bookId: string): Promise<Mention[]> {
    const userMentions = await this.local.getUserMentions();
    const mine = userMentions.filter((m) => m.bookId === bookId);
    return [...this.seed.mentionsForBook(bookId), ...mine].sort(byReadingOrder);
  }

  /**
   * Every mention the reader has logged, across all books, newest-first — the
   * read path for the My stuff screen (which joins each to its book). Mentions
   * carry no timestamp, so "newest" is store order (create appends) reversed.
   */
  async allUserMentions(): Promise<Mention[]> {
    const mentions = await this.local.getUserMentions();
    return [...mentions].reverse();
  }

  /** A single mention by id, searching the reader's mentions then seed content. */
  async getById(id: string): Promise<Mention | undefined> {
    const userMentions = await this.local.getUserMentions();
    return userMentions.find((m) => m.id === id) ?? this.seed.mentionById(id);
  }

  /** Create a personal, user-sourced mention. Validated before it is stored. */
  async create(draft: DraftMention): Promise<Mention> {
    const record = parseMention({
      ...draft,
      id: this.deps.newId(),
      source: 'user',
      status: 'personal',
      contributorRef: null,
      rejectionReason: null,
    });
    const mentions = await this.local.getUserMentions();
    await this.local.saveUserMentions([...mentions, record]);
    return record;
  }

  /** Edit an existing user mention. Throws if it isn't the reader's own. */
  async update(id: string, patch: MentionPatch): Promise<Mention> {
    const mentions = await this.local.getUserMentions();
    const existing = this.requireOwn(mentions, id);
    const updated = parseMention({ ...existing, ...patch });
    await this.local.saveUserMentions(mentions.map((m) => (m.id === id ? updated : m)));
    return updated;
  }

  /** Delete a user mention. Throws if it isn't the reader's own. */
  async remove(id: string): Promise<void> {
    const mentions = await this.local.getUserMentions();
    this.requireOwn(mentions, id);
    await this.local.saveUserMentions(mentions.filter((m) => m.id !== id));
  }

  /**
   * Apply a lifecycle transition (submit / approve / reject / revise) to a user
   * mention via the domain state machine, persisting the result. On `submit`
   * the mention is also handed to the remote source (a no-op in MVP).
   */
  async applyLifecycle(id: string, action: MentionAction, opts: ApplyOptions = {}): Promise<Mention> {
    const mentions = await this.local.getUserMentions();
    const existing = this.requireOwn(mentions, id);
    const updated = applyAction(existing, action, opts);
    await this.local.saveUserMentions(mentions.map((m) => (m.id === id ? updated : m)));
    if (action === 'submit') await this.remote.submitMention(updated);
    return updated;
  }

  /** Guard: the id must belong to one of the reader's own mentions. */
  private requireOwn(mentions: readonly Mention[], id: string): Mention {
    const found = mentions.find((m) => m.id === id);
    if (!found) {
      throw new Error(`Mention "${id}" is not editable (seed content or not found)`);
    }
    return found;
  }
}
