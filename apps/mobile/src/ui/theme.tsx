import { Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, useFonts } from '@expo-google-fonts/nunito';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme, type TextStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { useSettings } from '../store/settings';
import { darkColors, fontFamilies, LARGE_TEXT_FACTOR, lightColors, type FontWeight, type ThemeColors } from './tokens';

export interface Theme {
  colors: ThemeColors;
  scheme: 'light' | 'dark';
  /** Extra text scale from the "Larger text" setting (system font size is always respected too). */
  textScale: number;
  /** true when the system or the in-app setting asks for reduced motion. */
  reduceMotion: boolean;
  /** false only while the brand typeface is still loading (the splash stays up meanwhile). */
  fontsReady: boolean;
  /** Style for a weight: the brand typeface when loaded, the system font otherwise. */
  font: (weight: FontWeight) => TextStyle;
}

const ThemeContext = createContext<Theme | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const systemReduceMotion = useReducedMotion();
  const themeMode = useSettings((s) => s.themeMode);
  const largeText = useSettings((s) => s.largeText);
  const reduceMotionSetting = useSettings((s) => s.reduceMotion);
  const [fontsLoaded, fontsError] = useFonts({ Nunito_400Regular, Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold });

  const value = useMemo<Theme>(() => {
    const scheme = themeMode === 'system' ? (system === 'dark' ? 'dark' : 'light') : themeMode;
    return {
      colors: scheme === 'dark' ? darkColors : lightColors,
      scheme,
      textScale: largeText ? LARGE_TEXT_FACTOR : 1,
      reduceMotion: reduceMotionSetting || systemReduceMotion,
      fontsReady: fontsLoaded || !!fontsError,
      // Each weight is its own font file, so the weight itself must stay "normal" (no fake bold).
      font: (weight) => (fontsLoaded ? { fontFamily: fontFamilies[weight], fontWeight: 'normal' } : { fontWeight: weight }),
    };
  }, [themeMode, system, largeText, reduceMotionSetting, systemReduceMotion, fontsLoaded, fontsError]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside AppThemeProvider');
  return theme;
}
