/**
 * Hiillos design tokens — "embers" identity.
 *
 * Warm cream surfaces, a glowing ember as the brand colour and one soft colour per area of the app
 * (hub style: a tinted card with a simple illustration). Text/background pairs meet WCAG AA
 * (≥ 4.5:1 for body text); see src/ui/__tests__/contrast.test.ts.
 */

/** One soft colour family per area of the app. */
export type Category = 'ember' | 'night' | 'leaf' | 'sky' | 'sun' | 'rose';

export interface CategoryColors {
  /** Tinted card background. */
  bg: string;
  /** Illustration / large shapes (never used for small text). */
  art: string;
  /** Second illustration tone. */
  artSoft: string;
}

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  /** Brand colour dark enough for text, icons and selected states. */
  primary: string;
  onPrimary: string;
  primarySoft: string;
  /** Bright ember for the main call-to-action button (dark text on top). */
  cta: string;
  onCta: string;
  accent: string;
  onAccent: string;
  accentSoft: string;
  sand: string;
  border: string;
  danger: string;
  onDanger: string;
  dangerSoft: string;
  success: string;
  /** Amber for "keep an eye on it" states (text-safe). */
  warning: string;
  chartMood: string;
  chartSleep: string;
  chartActivity: string;
  chartReaction: string;
  chartDaylight: string;
  lakeTop: string;
  lakeBottom: string;
  categories: Record<Category, CategoryColors>;
}

export const lightColors: ThemeColors = {
  background: '#FBF5EC',
  surface: '#FFFFFF',
  surfaceAlt: '#F3EADC',
  text: '#2B211C',
  textMuted: '#6B5B52',
  primary: '#A93C16',
  onPrimary: '#FFFFFF',
  primarySoft: '#FBE3D2',
  cta: '#F5894A',
  onCta: '#2B1608',
  accent: '#4A45A8',
  onAccent: '#FFFFFF',
  accentSoft: '#E3E1F7',
  sand: '#F3EADC',
  border: '#E6D9C8',
  danger: '#B3261E',
  onDanger: '#FFFFFF',
  dangerSoft: '#F8DAD6',
  success: '#246B41',
  warning: '#8A5A00',
  chartMood: '#D9622B',
  chartSleep: '#6C63C7',
  chartActivity: '#4E9A6B',
  chartReaction: '#9B5BA5',
  chartDaylight: '#D9A21B',
  lakeTop: '#CFE3EC',
  lakeBottom: '#8DB5C7',
  categories: {
    ember: { bg: '#FBE3D2', art: '#F28C38', artSoft: '#FFD27A' },
    night: { bg: '#E3E1F7', art: '#6C63C7', artSoft: '#B9B4F0' },
    leaf: { bg: '#DDEEDD', art: '#4E9A6B', artSoft: '#A9D6B8' },
    sky: { bg: '#D9ECF5', art: '#3F8FB8', artSoft: '#A5D2E8' },
    sun: { bg: '#FCEFC4', art: '#E8B93A', artSoft: '#F7DE8F' },
    rose: { bg: '#F8DAD6', art: '#D9695C', artSoft: '#F0AFA7' },
  },
};

export const darkColors: ThemeColors = {
  background: '#1B1512',
  surface: '#261D19',
  surfaceAlt: '#31261F',
  text: '#F5EBE0',
  textMuted: '#C9B8A9',
  primary: '#FFB083',
  onPrimary: '#3A1505',
  primarySoft: '#4A2A1A',
  cta: '#F5894A',
  onCta: '#2B1608',
  accent: '#BDB8FF',
  onAccent: '#1C1946',
  accentSoft: '#322F5C',
  sand: '#3A2E24',
  border: '#45372D',
  danger: '#FFA79C',
  onDanger: '#3B0B07',
  dangerSoft: '#4A2320',
  success: '#8FD3A6',
  warning: '#F0C95A',
  chartMood: '#FFB083',
  chartSleep: '#BDB8FF',
  chartActivity: '#8FD3A6',
  chartReaction: '#DDB3E2',
  chartDaylight: '#F0C95A',
  lakeTop: '#1D3540',
  lakeBottom: '#0E1F27',
  categories: {
    ember: { bg: '#4A2A1A', art: '#F28C38', artSoft: '#FFD27A' },
    night: { bg: '#2C2A52', art: '#9D96F0', artSoft: '#5E58A8' },
    leaf: { bg: '#22392B', art: '#6FBF8D', artSoft: '#3F7A56' },
    sky: { bg: '#1F3644', art: '#6FB6DA', artSoft: '#3C7391' },
    sun: { bg: '#44391A', art: '#F0C95A', artSoft: '#9A7F2C' },
    rose: { bg: '#4A2320', art: '#F0897D', artSoft: '#9A4A42' },
  },
};

/** 8-pt grid. */
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
/** Generous, friendly corners. */
export const radii = { sm: 10, md: 16, lg: 24, xl: 32, pill: 999 } as const;

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';
export type FontWeight = '400' | '600' | '700' | '800';

export const typeScale: Record<TextVariant, { fontSize: number; lineHeight: number; fontWeight: FontWeight }> = {
  display: { fontSize: 32, lineHeight: 39, fontWeight: '800' },
  title: { fontSize: 25, lineHeight: 32, fontWeight: '800' },
  heading: { fontSize: 19, lineHeight: 26, fontWeight: '700' },
  body: { fontSize: 17, lineHeight: 25, fontWeight: '400' },
  label: { fontSize: 15, lineHeight: 21, fontWeight: '700' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
};

/** Rounded brand typeface (Nunito, SIL Open Font License). One family name per weight. */
export const fontFamilies: Record<FontWeight, string> = {
  '400': 'Nunito_400Regular',
  '600': 'Nunito_600SemiBold',
  '700': 'Nunito_700Bold',
  '800': 'Nunito_800ExtraBold',
};

/** Minimum touch target (dp). */
export const MIN_TOUCH = 48;
/** Multiplier applied when "Larger text" is on (on top of the system font size). */
export const LARGE_TEXT_FACTOR = 1.2;

/** Motion tokens. Every animation uses these (and is skipped when reduce motion is on). */
export const durations = { instant: 120, fast: 180, normal: 260, slow: 600 } as const;

/** Elevation tokens: soft warm shadows instead of borders to separate surfaces. */
export const elevation = {
  none: {},
  low: {
    shadowColor: '#5A3A22',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  high: {
    shadowColor: '#5A3A22',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

/** Upper bound for system font scaling on dense UI (headers, calendar cells). Body text allows 2×. */
export const MAX_FONT_SCALE = { dense: 1.4, body: 2 } as const;
