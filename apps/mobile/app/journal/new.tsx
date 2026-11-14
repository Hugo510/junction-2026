import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { EmotionId, Scale5 } from '../../src/domain/entities';
import { EmotionPicker } from '../../src/features/EmotionPicker';
import { MoodPicker } from '../../src/features/MoodPicker';
import { haptics } from '../../src/services/haptics';
import { useData } from '../../src/store/data';
import { AppText, Button, Chip, ChipGroup, Screen, radii, spacing, useTheme } from '../../src/ui';

/**
 * Quick journal entry: mood + feelings + free note.
 * Safety: if mood is low (≤ 2) we ask the safety question; notes are always scanned for crisis language.
 */
export default function NewJournalEntry() {
  const { t } = useTranslation();
  const { colors, textScale } = useTheme();
  const submitCheckIn = useData((s) => s.submitCheckIn);
  const [mood, setMood] = useState<Scale5 | null>(null);
  const [emotions, setEmotions] = useState<EmotionId[]>([]);
  const [note, setNote] = useState('');
  const [safety, setSafety] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const needsSafety = mood !== null && mood <= 2;
  const canSave = mood !== null && (!needsSafety || safety !== null);

  const save = async () => {
    if (!canSave || mood === null) return;
    setSaving(true);
    try {
      const { risk } = await submitCheckIn({
        kind: 'journal',
        mood,
        emotions,
        note: note.trim() || undefined,
        safetyConcern: safety === true,
      });
      haptics.confirm();
      router.back();
      if (risk.level === 'urgent') router.push({ pathname: '/crisis', params: { urgent: '1' } });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen footer={<Button title={t('journal.save')} onPress={save} disabled={!canSave} loading={saving} />}>
      <View style={{ gap: spacing.md }}>
        <AppText variant="heading">{t('journal.moodQuestion')}</AppText>
        <MoodPicker value={mood} onChange={setMood} />
      </View>

      <View style={{ gap: spacing.md }}>
        <AppText variant="heading">{t('journal.emotionsQuestion')}</AppText>
        <EmotionPicker
          selected={emotions}
          onToggle={(id) => setEmotions((cur) => (cur.includes(id) ? cur.filter((e) => e !== id) : [...cur, id]))}
        />
      </View>

      <View style={{ gap: spacing.sm }}>
        <AppText variant="heading">{t('journal.noteQuestion')}</AppText>
        <TextInput
          accessibilityLabel={t('journal.noteQuestion')}
          placeholder={t('journal.notePlaceholder')}
          placeholderTextColor={colors.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={2000}
          style={{
            minHeight: 140,
            borderWidth: 1,
            borderRadius: radii.md,
            padding: spacing.md,
            textAlignVertical: 'top',
            color: colors.text,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            fontSize: 17 * textScale,
          }}
        />
      </View>

      {needsSafety ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="label">{t('checkin.safety.question')}</AppText>
          <AppText variant="caption" tone="muted">
            {t('checkin.safety.context')}
          </AppText>
          <ChipGroup>
            <Chip label={t('common.no')} selected={safety === false} onPress={() => setSafety(false)} />
            <Chip label={t('common.yes')} selected={safety === true} onPress={() => setSafety(true)} />
          </ChipGroup>
        </View>
      ) : null}
    </Screen>
  );
}
