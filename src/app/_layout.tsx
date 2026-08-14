// Import per-weight subpaths (not the package root) so Metro bundles only the
// faces we use — the root re-exports every weight and isn't tree-shaken.
import { HankenGrotesk_400Regular } from '@expo-google-fonts/hanken-grotesk/400Regular';
import { HankenGrotesk_500Medium } from '@expo-google-fonts/hanken-grotesk/500Medium';
import { HankenGrotesk_600SemiBold } from '@expo-google-fonts/hanken-grotesk/600SemiBold';
import { HankenGrotesk_700Bold } from '@expo-google-fonts/hanken-grotesk/700Bold';
import { Newsreader_400Regular } from '@expo-google-fonts/newsreader/400Regular';
import { Newsreader_400Regular_Italic } from '@expo-google-fonts/newsreader/400Regular_Italic';
import { Newsreader_500Medium } from '@expo-google-fonts/newsreader/500Medium';
import { Newsreader_600SemiBold } from '@expo-google-fonts/newsreader/600SemiBold';
import { Newsreader_600SemiBold_Italic } from '@expo-google-fonts/newsreader/600SemiBold_Italic';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider as NavThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { FirstRunGate } from '@/components/FirstRunGate';
import { RepositoriesProvider } from '@/repositories';
import { ThemeProvider, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

/** Build a react-navigation theme from our tokens so chrome matches the design. */
function NavigationChrome() {
  const t = useTheme();
  const base = t.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: t.color.text,
      background: t.color.bg,
      card: t.color.surface,
      text: t.color.text,
      border: t.color.border,
    },
  };

  return (
    <NavThemeProvider value={navTheme}>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.color.bg } }}
      />
    </NavThemeProvider>
  );
}

/**
 * Status-bar style, hoisted out of NavigationChrome so it also applies while the
 * welcome pager is up (the pager renders instead of the navigator, and its canvas
 * is the same `bg`, so it wants the same treatment).
 */
function AppStatusBar() {
  const t = useTheme();
  return <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  // Font family names are keyed to these constants; keep in sync with FONT_FAMILY in theme/tokens.ts.
  const [fontsLoaded, fontError] = useFonts({
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_600SemiBold,
    Newsreader_400Regular_Italic,
    Newsreader_600SemiBold_Italic,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
  });

  // The splash now comes down in two stages: fonts must resolve before anything
  // renders (below), then FirstRunGate reports once it knows whether this launch
  // opens in the welcome pager. Hiding earlier would flash the Library behind a
  // pager about to cover it.
  const hideSplash = useCallback(() => {
    SplashScreen.hideAsync();
  }, []);

  // Hold on the splash until fonts resolve (or fail) so text never flashes in a fallback face.
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RepositoriesProvider>
          <FirstRunGate onReady={hideSplash}>
            <NavigationChrome />
          </FirstRunGate>
          <AppStatusBar />
        </RepositoriesProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
