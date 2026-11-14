import '../src/i18n';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ReachOutBanner } from '../src/features/outreach/ReachOutBanner';
import { applyLanguage, detectDeviceLanguage } from '../src/i18n';
import { useData } from '../src/store/data';
import { useSettings } from '../src/store/settings';
import { AppSkeleton, AppThemeProvider, ErrorState, HelpButton, useTheme } from '../src/ui';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppThemeProvider>
          <Bootstrap />
        </AppThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Bootstrap() {
  const { colors, scheme } = useTheme();
  const { t } = useTranslation();
  const hydrated = useSettings((s) => s.hydrated);
  const language = useSettings((s) => s.language);
  const setLanguage = useSettings((s) => s.setLanguage);
  const status = useData((s) => s.status);
  const load = useData((s) => s.load);

  // First launch: device language (or English). Afterwards: the saved choice.
  useEffect(() => {
    if (!hydrated) return;
    if (!language) setLanguage(detectDeviceLanguage());
    else applyLanguage(language);
  }, [hydrated, language, setLanguage]);

  useEffect(() => {
    if (hydrated && status === 'idle') void load();
  }, [hydrated, status, load]);

  const ready = hydrated && (status === 'ready' || status === 'error');
  // Hide the native splash as soon as settings are read; the skeleton covers the data load.
  useEffect(() => {
    if (hydrated) SplashScreen.hideAsync().catch(() => undefined);
  }, [hydrated]);

  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: colors.background, card: colors.background, text: colors.text, border: colors.border, primary: colors.primary },
    };
  }, [scheme, colors]);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AppSkeleton />
      </View>
    );
  }
  if (status === 'error') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <ErrorState onRetry={load} />
      </View>
    );
  }

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
          headerRight: () => <HelpButton />,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="chat" options={{ headerShown: false }} />
        <Stack.Screen name="checkin" options={{ title: t('checkin.title') }} />
        <Stack.Screen name="progress" options={{ title: t('menu.progress') }} />
        <Stack.Screen name="journal/new" options={{ presentation: 'modal', title: t('journal.newTitle') }} />
        <Stack.Screen name="comfort" options={{ title: t('menu.comfort') }} />
        <Stack.Screen name="care" options={{ title: t('menu.care') }} />
        <Stack.Screen name="crisis" options={{ presentation: 'modal', title: t('crisis.title'), headerRight: () => null }} />
        <Stack.Screen name="consult" options={{ presentation: 'modal', title: t('care.consult.title') }} />
        <Stack.Screen name="settings/index" options={{ title: t('settings.title') }} />
        <Stack.Screen name="privacy/index" options={{ title: t('privacy.title') }} />
        <Stack.Screen name="demo" options={{ title: t('demo.title') }} />
        <Stack.Screen name="exercise" options={{ headerShown: false }} />
      </Stack>
      <ReachOutBanner />
    </ThemeProvider>
  );
}
