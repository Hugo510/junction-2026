/**
 * Text helpers for simple, language-agnostic keyword matching (en / fi / es / sv).
 * Lowercase, accents/umlauts removed (ä → a, ñ → n), punctuation → spaces.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Keyword syntax:
 * - "two words" → phrase contained in the normalized text
 * - "word*"     → any token starting with "word" (Finnish inflections, suicid*…)
 * - "word"      → exact token
 * Keywords must already be written in normalized form.
 */
export function matchesAny(text: string, keywords: readonly string[]): boolean {
  const normalized = normalizeText(text);
  if (!normalized) return false;
  const padded = ` ${normalized} `;
  const tokens = normalized.split(' ');
  return keywords.some((kw) => {
    if (kw.includes(' ')) return padded.includes(` ${kw} `);
    if (kw.endsWith('*')) {
      const stem = kw.slice(0, -1);
      return tokens.some((t) => t.startsWith(stem));
    }
    return tokens.includes(kw);
  });
}
