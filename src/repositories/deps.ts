/**
 * Injected side-effect providers for repositories: id minting and the clock.
 *
 * Repositories stay pure by taking these rather than calling globals — tests
 * pass deterministic generators; the app factory wires expo-crypto's randomUUID
 * and the real clock. `newId` must return a UUID (records carry UUID string ids
 * so local writes sync to a Phase-2 backend without re-keying).
 */
export interface RepoDeps {
  /** A fresh UUID for a new record. */
  newId(): string;
  /** Current time as an ISO-8601 string (note timestamps). */
  now(): string;
}
