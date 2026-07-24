/**
 * The domain layer — entities, enums, the mention lifecycle, and validated
 * (de)serialization. This is the lowest layer: it depends on nothing else in
 * the app (the theme imports its shared types from here, not the reverse).
 */
export * from './enums';
export * from './palette';
export * from './book';
export * from './mention';
export * from './note';
export * from './seed';
export * from './lifecycle';
export * from './serialization';
