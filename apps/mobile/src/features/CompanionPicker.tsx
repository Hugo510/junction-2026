import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { CompanionSpecies } from '../domain/entities';
import { haptics } from '../services/haptics';
import { AppText, Avatar, radii, spacing, useTheme } from '../ui';

export const SPECIES: CompanionSpecies[] = ['bee', 'cat', 'dog', 'bird', 'person'];

export interface CompanionPickerProps {
  species: CompanionSpecies;
  name: string;
  onSpecies: (s: CompanionSpecies) => void;
  onName: (n: string) => void;
}

export function CompanionPicker({ species, name, onSpecies, onName }: CompanionPickerProps) {
  const { t } = useTranslation();
  const { colors, textScale, font } = useTheme();
  return (
    <View style={{ gap: spacing.lg }}>
      <View style={styles.grid} accessibilityRole="radiogroup">
        {SPECIES.map((s) => {
          const selected = s === species;
          return (
            <Pressable
              key={s}
              accessibilityRole="radio"
              accessibilityLabel={t(`species.${s}`)}
              accessibilityState={{ selected, checked: selected }}
              onPress={() => {
                haptics.tap();
                onSpecies(s);
              }}
              style={[
                styles.option,
                { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.surface },
              ]}
            >
              <Avatar species={s} size={64} />
              <AppText variant="label">{t(`species.${s}`)}</AppText>
            </Pressable>
          );
        })}
      </View>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="label">{t('onboarding.companion.nameLabel')}</AppText>
        <TextInput
          accessibilityLabel={t('onboarding.companion.nameLabel')}
          value={name}
          onChangeText={onName}
          placeholder={t('onboarding.companion.namePlaceholder')}
          placeholderTextColor={colors.textMuted}
          maxLength={24}
          style={[styles.input, font('400'), { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, fontSize: 17 * textScale }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  option: {
    flexGrow: 1,
    flexBasis: 96,
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
  },
  input: { minHeight: 52, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.md },
});
