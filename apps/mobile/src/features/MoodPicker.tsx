import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { Scale5 } from '../domain/entities';
import { haptics } from '../services/haptics';
import { AppText, MIN_TOUCH, MoodFace, radii, spacing, useTheme } from '../ui';

const LEVELS: Scale5[] = [1, 2, 3, 4, 5];

/** Five illustrated faces. `compact` = single row for chat cards. */
export function MoodPicker({
  value,
  onChange,
  compact = false,
  disabled = false,
}: {
  value: Scale5 | null;
  onChange: (mood: Scale5) => void;
  compact?: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { colors, textScale } = useTheme();
  return (
    <View style={[styles.row, compact && styles.compactRow]} accessibilityRole="radiogroup">
      {LEVELS.map((level) => {
        const selected = value === level;
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
              onChange(level);
            }}
            style={[
              compact ? styles.compactOption : styles.option,
              {
                borderColor: selected ? colors.primary : colors.border,
                backgroundColor: selected ? colors.primarySoft : colors.surface,
                opacity: disabled && !selected ? 0.5 : 1,
              },
            ]}
          >
            <MoodFace level={level} size={(compact ? 40 : 52) * textScale} />
            {!compact ? (
              <AppText variant="caption" align="center">
                {label}
              </AppText>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  compactRow: { flexWrap: 'nowrap', gap: spacing.xs },
  option: {
    flexGrow: 1,
    flexBasis: 90,
    minHeight: MIN_TOUCH * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1.5,
    padding: spacing.sm,
  },
  compactOption: {
    flex: 1,
    minHeight: MIN_TOUCH + 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingVertical: spacing.xs,
  },
});
