/**
 * Hiillos design tokens — minimal "one ember" system.
 *
 * Neutral base (near-white background, white cards, charcoal text) and ONE accent: the ember.
 * Colour is spent only where it carries meaning: the main action, the selected state, and the
 * three status colours (red is reserved for danger). Everything else is neutral, so hierarchy
 * comes from size, weight and position, not from decoration.
 *
 * Text/background pairs meet WCAG AA (≥ 4.5:1); see src/ui/__tests__/contrast.test.ts.
 */

/** Areas of the app. They used to have one colour each; now they share the same quiet card. */
export type Category = 'ember' | 'night' | 'leaf' | 'sky' | 'sun' | 'rose';

export interface CategoryColors {
  /** Card background. */
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
  /** The ember, dark enough for text, icons and selected states. */
  primary: string;
  onPrimary: string;
  primarySoft: string;
  /** Bright ember for the main call-to-action button (dark text on top). */
  cta: string;
  onCta: string;
  /** Neutral emphasis (notes, the help button). Not a second brand colour. */
  accent: string;
  onAccent: string;
  accentSoft: string;
  sand: string;
  border: string;
  danger: string;
  onDanger: string;
  dangerSoft: string;
  success: string;
  successSoft: string;
  /** Amber for "keep an eye on it" states (text-safe). */
  warning: string;
  warningSoft: string;
  chartMood: string;
  chartSleep: string;
  chartActivity: string;
  chartReaction: string;
  chartDaylight: string;
  lakeTop: string;
  lakeBottom: string;
  categories: Record<Category, CategoryColors>;
}

/** Every area uses the same card and the same ember tones: one system, no rainbow. */
const sameForAll = (c: CategoryColors): Record<Category, CategoryColors> => ({ ember: c, night: c, leaf: c, sky: c, sun: c, rose: c });

export const lightColors: ThemeColors = {
  background: '#F7F7F5',
  surface: '#FFFFFF',
  surfaceAlt: '#F0EFEC',
  text: '#1F1B18',
  textMuted: '#625C57',
  primary: '#A93C16',
  onPrimary: '#FFFFFF',
  primarySoft: '#FBEDE5',
  cta: '#F5894A',
  onCta: '#2B1608',
  accent: '#3F3A36',
  onAccent: '#FFFFFF',
  accentSoft: '#EFEEEB',
  sand: '#F0EFEC',
  border: '#E4E2DD',
  danger: '#B3261E',
  onDanger: '#FFFFFF',
  dangerSoft: '#FBE9E7',
  success: '#246B41',
  successSoft: '#E6F2EA',
  warning: '#8A5A00',
  warningSoft: '#FBF1D6',
  chartMood: '#D9622B',
  chartSleep: '#5B5F6B',
  chartActivity: '#8C8780',
  chartReaction: '#B0AAA2',
  chartDaylight: '#E8A15E',
  lakeTop: '#CFE3EC',
  lakeBottom: '#8DB5C7',
  categories: sameForAll({ bg: '#FFFFFF', art: '#F28C38', artSoft: '#FAD9C0' }),
};

export const darkColors: ThemeColors = {
  background: '#141312',
  surface: '#1E1C1A',
  surfaceAlt: '#282522',
  text: '#F2EFEA',
  textMuted: '#B8B1A8',
  primary: '#FFB083',
  onPrimary: '#3A1505',
  primarySoft: '#3A2418',
  cta: '#F5894A',
  onCta: '#2B1608',
  accent: '#E6E1DA',
  onAccent: '#1E1C1A',
  accentSoft: '#2C2926',
  sand: '#282522',
  border: '#3A3632',
  danger: '#FFA79C',
  onDanger: '#3B0B07',
  dangerSoft: '#40211E',
  success: '#8FD3A6',
  successSoft: '#1F3327',
  warning: '#F0C95A',
  warningSoft: '#3A3118',
  chartMood: '#FFB083',
  chartSleep: '#A9ADB8',
  chartActivity: '#8C8780',
  chartReaction: '#6E6962',
  chartDaylight: '#E8A15E',
  lakeTop: '#1D3540',
  lakeBottom: '#0E1F27',
  categories: sameForAll({ bg: '#1E1C1A', art: '#F28C38', artSoft: '#7A4A26' }),
};

/** 8-pt grid. */
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 } as const;
/** Calm, modern corners (cards 18–24, controls fully round). */
export const radii = { sm: 8, md: 12, lg: 18, xl: 24, pill: 999 } as const;

export type TextVariant = 'display' | 'title' | 'heading' | 'body' | 'label' | 'caption';
export type FontWeight = '400' | '600' | '700' | '800';

/** Hierarchy by size and weight: one display, one title, then quieter steps. */
export const typeScale: Record<TextVariant, { fontSize: number; lineHeight: number; fontWeight: FontWeight }> = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800' },
  heading: { fontSize: 18, lineHeight: 25, fontWeight: '700' },
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

/** Elevation tokens: one very soft neutral shadow; cards also carry a hairline border. */
export const elevation = {
  none: {},
  low: {
    shadowColor: '#1F1B18',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  high: {
    shadowColor: '#1F1B18',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

/** Upper bound for system font scaling on dense UI (headers, calendar cells). Body text allows 2×. */
export const MAX_FONT_SCALE = { dense: 1.4, body: 2 } as const;
