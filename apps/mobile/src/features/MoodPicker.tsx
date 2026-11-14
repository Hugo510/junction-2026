import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Scale5 } from '../domain/entities';
import { haptics } from '../services/haptics';
import { AppText, MAX_FONT_SCALE, MIN_TOUCH, MoodEmber, MoodFace, radii, spacing, useTheme } from '../ui';

const LEVELS: Scale5[] = [1, 2, 3, 4, 5];

/**
 * Five illustrated faces. `compact` = single row for chat cards; the chosen label is shown
 * underneath as visible confirmation (not only for screen readers).
 */
export function MoodPicker({
  value,
  onChange,
  compact = false,
  disabled = false,
  glyph = 'face',
}: {
  value: Scale5 | null;
  onChange: (mood: Scale5) => void;
  compact?: boolean;
  disabled?: boolean;
  /** "ember" = the daily one-tap moment in the chat; "face" = journal and weekly check-in. */
  glyph?: 'face' | 'ember';
}) {
  const { t } = useTranslation();
  const { colors, textScale } = useTheme();
  const [picked, setPicked] = useState<Scale5 | null>(null);
  const current = value ?? picked;

  return (
    <View style={{ gap: spacing.xs }}>
      <View style={[styles.row, compact && styles.compactRow]} accessibilityRole="radiogroup">
        {LEVELS.map((level) => {
          const selected = current === level;
          const label = t(`checkin.mood.levels.${level}`);
          return (
            <Pressable
              key={level}
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityLabel={t('a11y.moodOption', { value: level, label })}
              accessibilityState={{ selected, checked: selected, disabled }}
              onPress={() => {
                haptics.tap();
                setPicked(level);
                onChange(level);
              }}
              style={[
                compact ? styles.compactOption : styles.option,
                {
                  backgroundColor: selected ? colors.primarySoft : colors.surfaceAlt,
                  borderColor: selected ? colors.primary : 'transparent',
                  opacity: disabled && !selected ? 0.45 : 1,
                },
              ]}
            >
              {glyph === 'ember' ? (
                <MoodEmber level={level} size={(compact ? 44 : 56) * textScale} />
              ) : (
                <MoodFace level={level} size={(compact ? 40 : 52) * textScale} />
              )}
              {!compact ? (
                <AppText variant="caption" align="center" maxFontSizeMultiplier={MAX_FONT_SCALE.dense}>
                  {label}
                </AppText>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {compact && current ? (
        <AppText variant="caption" tone="primary" align="center" accessibilityLiveRegion="polite">
          {t(`checkin.mood.levels.${current}`)}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  compactRow: { flexWrap: 'nowrap', gap: spacing.xs },
  option: {
    flexGrow: 1,
    flexBasis: 88,
    minHeight: MIN_TOUCH * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 2,
    padding: spacing.sm,
  },
  compactOption: {
    flex: 1,
    minHeight: MIN_TOUCH + 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 2,
    paddingVertical: spacing.xs,
  },
});
