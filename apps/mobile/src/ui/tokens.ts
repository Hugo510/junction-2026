/**
 * Design tokens. Soft palette (sage greens, lavender blues, sand).
 * Text/background pairs were chosen to meet WCAG AA (≥ 4.5:1 for body text).
 */
export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  primary: string;
  onPrimary: string;
  primarySoft: string;
  accent: string;
  onAccent: string;
  accentSoft: string;
  sand: string;
  border: string;
  danger: string;
  onDanger: string;
  dangerSoft: string;
  success: string;
  chartMood: string;
  chartSleep: string;
  chartActivity: string;
  chartReaction: string;
  chartDaylight: string;
  lakeTop: string;
  lakeBottom: string;
}

export const lightColors: ThemeColors = {
  background: '#F7F4EE',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF3EF',
  text: '#1E2621',
  textMuted: '#4F5B54',
  primary: '#3D6B52',
  onPrimary: '#FFFFFF',
  primarySoft: '#DCEADF',
  accent: '#555A99',
  onAccent: '#FFFFFF',
  accentSoft: '#E6E6F5',
  sand: '#EFE6D6',
  border: '#D5DBD5',
  danger: '#A33A2F',
  onDanger: '#FFFFFF',
  dangerSoft: '#F8E3E0',
  success: '#2F6B45',
  chartMood: '#3D6B52',
  chartSleep: '#555A99',
  chartActivity: '#8A6A2E',
  chartReaction: '#7A4E7E',
  chartDaylight: '#B07B12',
  lakeTop: '#CFE3EC',
  lakeBottom: '#8DB5C7',
};

export const darkColors: ThemeColors = {
  background: '#121614',
  surface: '#1B211E',
  surfaceAlt: '#232B27',
  text: '#E9EEEA',
  textMuted: '#B4BFB8',
  primary: '#9CCBAE',
  onPrimary: '#0F1F16',
  primarySoft: '#2A3B31',
  accent: '#B9BCF0',
  onAccent: '#161833',
  accentSoft: '#2D2F48',
  sand: '#3A342A',
  border: '#36413B',
  danger: '#F2A094',
  onDanger: '#2A0E0A',
  dangerSoft: '#3B2522',
  success: '#9CCBAE',
  chartMood: '#9CCBAE',
  chartSleep: '#B9BCF0',
  chartActivity: '#E3C38A',
  chartReaction: '#D9B3DC',
  chartDaylight: '#F2D27A',
  lakeTop: '#1D3540',
  lakeBottom: '#0E1F27',
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
export const radii = { sm: 8, md: 14, lg: 22, pill: 999 } as const;

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';

export const typeScale: Record<TextVariant, { fontSize: number; lineHeight: number; fontWeight: '400' | '600' | '700' }> = {
  display: { fontSize: 30, lineHeight: 38, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  heading: { fontSize: 19, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 17, lineHeight: 25, fontWeight: '400' },
  label: { fontSize: 15, lineHeight: 21, fontWeight: '600' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
};

/** Minimum touch target (dp). */
export const MIN_TOUCH = 48;
/** Multiplier applied when "Larger text" is on (on top of the system font size). */
export const LARGE_TEXT_FACTOR = 1.2;

/** Motion tokens. Every animation uses these (and is skipped when reduce motion is on). */
export const durations = { instant: 120, fast: 180, normal: 260, slow: 600 } as const;

/** Elevation tokens: soft shadows instead of borders to separate surfaces. */
export const elevation = {
  none: {},
  low: {
    shadowColor: '#1E2621',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  high: {
    shadowColor: '#1E2621',
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

/** Upper bound for system font scaling on dense UI (headers, calendar cells). Body text allows 2×. */
export const MAX_FONT_SCALE = { dense: 1.4, body: 2 } as const;
