/**
 * Repositories context — builds the app's repositories once (with real data
 * sources) and shares them tree-wide, mirroring the theme layer's provider.
 *
 * Tests never touch this: they construct repositories directly with an
 * InMemoryLocalStore. Screens read the shared instance via useRepositories().
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { createRepositories, type Repositories } from './create';

const RepositoriesContext = createContext<Repositories | null>(null);

export function RepositoriesProvider({ children }: { children: ReactNode }) {
  // createRepositories() pulls in AsyncStorage/expo-crypto; build it once.
  const repositories = useMemo(() => createRepositories(), []);
  return (
    <RepositoriesContext.Provider value={repositories}>{children}</RepositoriesContext.Provider>
  );
}

/** The shared repositories. Throws if used outside the provider. */
export function useRepositories(): Repositories {
  const repositories = useContext(RepositoriesContext);
  if (!repositories) {
    throw new Error('useRepositories must be used within a RepositoriesProvider');
  }
  return repositories;
}
