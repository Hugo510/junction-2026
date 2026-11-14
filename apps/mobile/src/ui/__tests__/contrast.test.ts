import { darkColors, lightColors, type ThemeColors } from '../tokens';

/** WCAG 2.1 relative luminance and contrast ratio. */
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const AA = 4.5;

/** Every text / background pair the app actually uses. */
function pairs(c: ThemeColors): [string, string, string][] {
  const tinted = Object.entries(c.categories).flatMap(([name, cat]): [string, string, string][] => [
    [`text on ${name} card`, c.text, cat.bg],
    [`muted text on ${name} card`, c.textMuted, cat.bg],
  ]);
  return [
    ['text on background', c.text, c.background],
    ['text on surface', c.text, c.surface],
    ['text on surfaceAlt', c.text, c.surfaceAlt],
    ['muted on background', c.textMuted, c.background],
    ['muted on surface', c.textMuted, c.surface],
    ['muted on surfaceAlt', c.textMuted, c.surfaceAlt],
    ['primary text on background', c.primary, c.background],
    ['primary text on surface', c.primary, c.surface],
    ['primary text on primarySoft', c.primary, c.primarySoft],
    ['onPrimary on primary', c.onPrimary, c.primary],
    ['onCta on cta (main button)', c.onCta, c.cta],
    ['accent text on background', c.accent, c.background],
    ['accent text on accentSoft', c.accent, c.accentSoft],
    ['onAccent on accent', c.onAccent, c.accent],
    ['danger text on dangerSoft', c.danger, c.dangerSoft],
    ['danger text on background', c.danger, c.background],
    ['onDanger on danger', c.onDanger, c.danger],
    ['text on dangerSoft', c.text, c.dangerSoft],
    ['success text on surface', c.success, c.surface],
    ['success text on leaf card', c.success, c.categories.leaf.bg],
    ['warning text on surface', c.warning, c.surface],
    ['warning text on sun card', c.warning, c.categories.sun.bg],
    ['danger text on rose card', c.danger, c.categories.rose.bg],
    ['accent text on night card', c.accent, c.categories.night.bg],
    ['primary text on ember card', c.primary, c.categories.ember.bg],
    ['text on primarySoft', c.text, c.primarySoft],
    ['text on accentSoft', c.text, c.accentSoft],
    ['text on sand', c.text, c.sand],
    ['muted on sand', c.textMuted, c.sand],
    ...tinted,
  ];
}

describe.each([
  ['light', lightColors],
  ['dark', darkColors],
])('%s theme meets WCAG AA for text', (_name, colors) => {
  it.each(pairs(colors))('%s', (_label, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(AA);
  });
});
