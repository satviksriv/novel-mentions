import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavThemeProvider,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <NavigationChrome />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
