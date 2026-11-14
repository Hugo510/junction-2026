import { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { isEmptyBodyMap, usualBodyMap } from '../domain/bodyMap';
import type { BodyMap, CheckIn, EmotionId, ReactionAggregate, Scale5 } from '../domain/entities';
import type { RiskAssessment } from '../domain/riskRules';
import { haptics } from '../services/haptics';
import { useData } from '../store/data';
import { useSettings } from '../store/settings';
import { AppText, Button, Slider, radii, spacing, useTheme } from '../ui';
import { BodyMapEditor } from './bodymap/BodyMap';
import { EmotionPicker } from './EmotionPicker';
import { MoodPicker } from './MoodPicker';
import { ReactionGame } from './ReactionGame';

type Step = 'mood' | 'emotions' | 'body' | 'energy' | 'sleep' | 'game' | 'safety' | 'note';

const STEPS: Record<'full' | 'baseline', Step[]> = {
  // Weekly check-in: the body map ("Where is your fire today?") takes the place of the feelings list.
  full: ['mood', 'body', 'energy', 'sleep', 'game', 'safety', 'note'],
  baseline: ['mood', 'emotions', 'sleep', 'safety'],
};

export interface CheckInResult {
  checkIn: CheckIn;
  risk: RiskAssessment;
}

export interface CheckInFlowProps {
  variant: 'full' | 'baseline';
  onSubmitted: (result: CheckInResult) => void;
}

/** Step-by-step check-in: one question per screen, calm and short. */
export function CheckInFlow({ variant, onSubmitted }: CheckInFlowProps) {
  const { t } = useTranslation();
  const { colors, textScale } = useTheme();
  const submitCheckIn = useData((s) => s.submitCheckIn);
  const tapsAllowed = useSettings((s) => s.consents.taps);
  const steps = STEPS[variant];

  const [index, setIndex] = useState(0);
  const [mood, setMood] = useState<Scale5 | null>(null);
  const [emotions, setEmotions] = useState<EmotionId[]>([]);
  const [bodyMap, setBodyMap] = useState<BodyMap>({});
  const history = useData((s) => s.checkIns);
  const usualMap = useMemo(() => usualBodyMap(history), [history]);
  const [energy, setEnergy] = useState<Scale5>(3);
  const [anxiety, setAnxiety] = useState<Scale5>(2);
  const [sleepHours, setSleepHours] = useState(7);
  const [reaction, setReaction] = useState<ReactionAggregate | undefined>();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const step = steps[index];
  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setIndex((i) => Math.max(i - 1, 0));

  const submit = async (safetyConcern: boolean) => {
    if (saving || mood === null) return;
    setSaving(true);
    try {
      const result = await submitCheckIn({
        kind: 'full',
        mood,
        emotions,
        bodyMap: isEmptyBodyMap(bodyMap) ? undefined : bodyMap,
        energy,
        anxiety,
        sleepHours,
        reaction,
        note: note.trim() || undefined,
        safetyConcern,
      });
      haptics.confirm();
      onSubmitted(result);
    } finally {
      setSaving(false);
    }
  };

  const onSafety = (answer: boolean) => {
    haptics.tap();
    // A "yes" is handled immediately: save and go to the crisis screen.
    if (answer || index === steps.length - 1) void submit(answer);
    else next();
  };

  const canContinue = step === 'mood' ? mood !== null : true;
  const showFooter = step !== 'game' && step !== 'safety';
  const isLast = index === steps.length - 1;

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" tone="muted">
        {t('checkin.step', { current: index + 1, total: steps.length })}
      </AppText>

      {step === 'mood' && (
        <View style={styles.block}>
          <AppText variant="title">{t('checkin.mood.question')}</AppText>
          <MoodPicker value={mood} onChange={setMood} />
        </View>
      )}

      {step === 'emotions' && (
        <View style={styles.block}>
          <AppText variant="title">{t('journal.emotionsQuestion')}</AppText>
          <EmotionPicker
            selected={emotions}
            onToggle={(id) => setEmotions((cur) => (cur.includes(id) ? cur.filter((e) => e !== id) : [...cur, id]))}
          />
        </View>
      )}

      {step === 'body' && (
        <View style={styles.block}>
          <AppText variant="title">{t('bodyMap.title')}</AppText>
          <AppText tone="muted">{t('bodyMap.hint')}</AppText>
          <BodyMapEditor value={bodyMap} onChange={setBodyMap} usual={usualMap} />
        </View>
      )}

      {step === 'energy' && (
        <View style={styles.block}>
          <AppText variant="title">{t('checkin.energy.question')}</AppText>
          <Slider
            label={t('checkin.energy.question')}
            value={energy}
            min={1}
            max={5}
            onChange={(v) => setEnergy(v as Scale5)}
            minLabel={t('checkin.energy.low')}
            maxLabel={t('checkin.energy.high')}
            formatValue={(v) => t('checkin.scaleValue', { value: v })}
          />
          <AppText variant="heading" style={{ marginTop: spacing.md }}>
            {t('checkin.anxiety.question')}
          </AppText>
          <Slider
            label={t('checkin.anxiety.question')}
            value={anxiety}
            min={1}
            max={5}
            onChange={(v) => setAnxiety(v as Scale5)}
            minLabel={t('checkin.anxiety.low')}
            maxLabel={t('checkin.anxiety.high')}
            formatValue={(v) => t('checkin.scaleValue', { value: v })}
          />
        </View>
      )}

      {step === 'sleep' && (
        <View style={styles.block}>
          <AppText variant="title">{t('checkin.sleep.question')}</AppText>
          <Slider
            label={t('checkin.sleep.question')}
            value={sleepHours}
            min={3}
            max={11}
            step={0.5}
            onChange={setSleepHours}
            minLabel={t('checkin.sleep.value', { hours: 3 })}
            maxLabel={t('checkin.sleep.value', { hours: 11 })}
            formatValue={(v) => t('checkin.sleep.value', { hours: v })}
          />
        </View>
      )}

      {step === 'game' &&
        (tapsAllowed ? (
          <ReactionGame
            onDone={(r) => {
              setReaction(r);
              next();
            }}
            onSkip={next}
          />
        ) : (
          <View style={styles.block}>
            <AppText variant="title">{t('checkin.game.title')}</AppText>
            <AppText tone="muted">{t('checkin.game.off')}</AppText>
            <Button title={t('common.continue')} onPress={next} />
          </View>
        ))}

      {step === 'safety' && (
        <View style={styles.block}>
          <AppText variant="caption" tone="muted">
            {t('checkin.safety.title')}
          </AppText>
          <AppText variant="title">{t('checkin.safety.question')}</AppText>
          <AppText tone="muted">{t('checkin.safety.context')}</AppText>
          <View style={styles.safetyRow}>
            <Button title={t('common.no')} variant="secondary" onPress={() => onSafety(false)} style={styles.flex} loading={saving} />
            <Button title={t('common.yes')} variant="secondary" onPress={() => onSafety(true)} style={styles.flex} disabled={saving} />
          </View>
          {index > 0 ? <Button title={t('common.back')} variant="ghost" onPress={back} /> : null}
        </View>
      )}

      {step === 'note' && (
        <View style={styles.block}>
          <AppText variant="title">{t('checkin.note.question')}</AppText>
          <TextInput
            accessibilityLabel={t('checkin.note.question')}
            placeholder={t('checkin.note.placeholder')}
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface, fontSize: 17 * textScale },
            ]}
          />
        </View>
      )}

      {showFooter && (
        <View style={styles.footer}>
          {isLast ? (
            <Button title={t('checkin.save')} onPress={() => submit(false)} loading={saving} />
          ) : (
            <Button title={t('common.continue')} onPress={next} disabled={!canContinue} />
          )}
          {index > 0 ? <Button title={t('common.back')} variant="ghost" onPress={back} /> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  block: { gap: spacing.md },
  safetyRow: { flexDirection: 'row', gap: spacing.md },
  flex: { flex: 1 },
  input: { minHeight: 120, borderWidth: 1, borderRadius: radii.md, padding: spacing.md, textAlignVertical: 'top' },
  footer: { gap: spacing.sm },
});
