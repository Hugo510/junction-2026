import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { useSettings } from '../store/settings';
import { darkColors, LARGE_TEXT_FACTOR, lightColors, type ThemeColors } from './tokens';

export interface Theme {
  colors: ThemeColors;
  scheme: 'light' | 'dark';
  /** Extra text scale from the "Larger text" setting (system font size is always respected too). */
  textScale: number;
  /** true when the system or the in-app setting asks for reduced motion. */
  reduceMotion: boolean;
}

const ThemeContext = createContext<Theme | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const systemReduceMotion = useReducedMotion();
  const themeMode = useSettings((s) => s.themeMode);
  const largeText = useSettings((s) => s.largeText);
  const reduceMotionSetting = useSettings((s) => s.reduceMotion);

  const value = useMemo<Theme>(() => {
    const scheme = themeMode === 'system' ? (system === 'dark' ? 'dark' : 'light') : themeMode;
    return {
      colors: scheme === 'dark' ? darkColors : lightColors,
      scheme,
      textScale: largeText ? LARGE_TEXT_FACTOR : 1,
      reduceMotion: reduceMotionSetting || systemReduceMotion,
    };
  }, [themeMode, system, largeText, reduceMotionSetting, systemReduceMotion]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside AppThemeProvider');
  return theme;
}
