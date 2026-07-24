/**
 * Repositories — the only data API the UI sees. Screens import from here.
 *
 * Barrel note: `create.ts` (and the AsyncStorage store it pulls in) is exported
 * for app wiring; unit tests import the repository classes and an
 * InMemoryLocalStore directly instead of going through the app factory.
 */
export { BookRepository } from './book-repository';
export {
  MentionRepository,
  type DraftMention,
  type MentionPatch,
} from './mention-repository';
export { NoteRepository, type DraftNote } from './note-repository';
export type { RepoDeps } from './deps';
export { createRepositories, type Repositories } from './create';
