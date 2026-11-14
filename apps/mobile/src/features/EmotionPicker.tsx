import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmotionId } from '../domain/entities';
import { EMOTIONS, type EmotionValence } from '../domain/journal';
import { AppText, Chip, spacing } from '../ui';

const GROUPS: EmotionValence[] = ['pleasant', 'difficult'];

/** Multi-select feelings, grouped as pleasant / difficult. */
export function EmotionPicker({
  selected,
  onToggle,
  disabled = false,
}: {
  selected: EmotionId[];
  onToggle: (id: EmotionId) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: spacing.md }}>
      {GROUPS.map((group) => (
        <View key={group} style={{ gap: spacing.sm }}>
          <AppText variant="caption" tone="muted">
            {t(`journal.${group}`)}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {EMOTIONS.filter((e) => e.valence === group).map((e) => (
              <Chip
                key={e.id}
                role="checkbox"
                label={`${e.emoji} ${t(`emotions.${e.id}`)}`}
                accessibilityLabel={t(`emotions.${e.id}`)}
                selected={selected.includes(e.id)}
                onPress={() => {
                  if (!disabled) onToggle(e.id);
                }}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}
