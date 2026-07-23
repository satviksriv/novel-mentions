/**
 * Theme context — resolves the system color scheme (with graceful fallback)
 * into a Theme and provides it app-wide. Screens read tokens via useTheme().
 */
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { resolveBookPalette, resolveTheme, type BookPalette, type Theme } from './theme';
import type { BookPaletteSource } from './tokens';

const ThemeContext = createContext<Theme>(resolveTheme('light'));

export function ThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme();
  const resolved = scheme === 'dark' ? 'dark' : 'light';
  const theme = useMemo(() => resolveTheme(resolved), [resolved]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/** The active, scheme-resolved theme. */
export function useTheme(): Theme {
  return useContext(ThemeContext);
}

/** Resolve a per-book palette source against the active scheme. */
export function useBookPalette(source: BookPaletteSource): BookPalette {
  const { scheme } = useTheme();
  return useMemo(() => resolveBookPalette(source, scheme), [source, scheme]);
}
