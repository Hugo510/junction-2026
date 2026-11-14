import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmotionId, Scale5 } from '../domain/entities';
import { EMOTIONS, type EmotionValence } from '../domain/journal';
import { AppText, Chip, spacing } from '../ui';

const GROUPS: EmotionValence[] = ['pleasant', 'difficult'];
const COMPACT_COUNT = 6;

/** Most likely feelings first, based on the chosen mood (low → difficult first, high → pleasant first). */
export function orderByMood(mood?: Scale5): EmotionId[] {
  const pleasant = EMOTIONS.filter((e) => e.valence === 'pleasant').map((e) => e.id);
  const difficult = EMOTIONS.filter((e) => e.valence === 'difficult').map((e) => e.id);
  if (mood === undefined) return [...pleasant, ...difficult];
  if (mood <= 2) return [...difficult, ...pleasant];
  if (mood >= 4) return [...pleasant, ...difficult];
  // Middle mood: interleave so both kinds are visible.
  return pleasant.flatMap((p, i) => [p, difficult[i]]).concat(difficult.slice(pleasant.length)).filter(Boolean) as EmotionId[];
}

/**
 * Multi-select feelings.
 * - compact: shows the 6 most likely for the mood + "More…" (used inside the chat).
 * - full: grouped as pleasant / difficult.
 */
export function EmotionPicker({
  selected,
  onToggle,
  disabled = false,
  compact = false,
  mood,
}: {
  selected: EmotionId[];
  onToggle: (id: EmotionId) => void;
  disabled?: boolean;
  compact?: boolean;
  mood?: Scale5;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const ordered = useMemo(() => orderByMood(mood), [mood]);
  const emoji = (id: EmotionId) => EMOTIONS.find((e) => e.id === id)?.emoji ?? '';

  const chip = (id: EmotionId) => (
    <Chip
      key={id}
      role="checkbox"
      label={`${emoji(id)} ${t(`emotions.${id}`)}`}
      accessibilityLabel={t(`emotions.${id}`)}
      selected={selected.includes(id)}
      onPress={() => {
        if (!disabled) onToggle(id);
      }}
    />
  );

  if (compact && !expanded) {
    const visible = [...new Set([...ordered.slice(0, COMPACT_COUNT), ...selected])];
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {visible.map(chip)}
        {!disabled ? <Chip role="button" label={t('journal.more')} onPress={() => setExpanded(true)} /> : null}
      </View>
    );
  }

  return (
    <View style={{ gap: spacing.md }}>
      {GROUPS.map((group) => (
        <View key={group} style={{ gap: spacing.sm }}>
          <AppText variant="caption" tone="muted">
            {t(`journal.${group}`)}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {EMOTIONS.filter((e) => e.valence === group).map((e) => chip(e.id))}
          </View>
        </View>
      ))}
    </View>
  );
}
