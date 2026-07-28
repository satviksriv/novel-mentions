/**
 * The confirmation prompt for removing a user-added book (#34), shared by both
 * entry points — the Book-detail overflow menu and the Library swipe action —
 * so the destructive copy stays identical. `onConfirm` runs only if the reader
 * taps Remove; it owns the actual removal (and its own error handling).
 */
import { Alert } from 'react-native';

import type { Book } from '@/domain';

export function confirmRemoveBook(book: Book, onConfirm: () => void | Promise<void>): void {
  Alert.alert(
    'Remove from library?',
    `This deletes “${book.title}” and your mentions and notes for it. This can’t be undone.`,
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void onConfirm() },
    ],
  );
}
