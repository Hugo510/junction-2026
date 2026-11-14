import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EMERGENCY_NUMBER } from '../../config/crisisResources';
import type { ChatCard } from '../../domain/chat/types';
import { lastNDates } from '../../domain/dates';
import type { EmotionId, Scale5 } from '../../domain/entities';
import { checkInsByDate, weeklyMoodTrend } from '../../domain/history';
import { getIntervention } from '../../domain/interventions';
import { emotionEmoji } from '../../domain/journal';
import { simulateQueueProgress } from '../../domain/consultQueue';
import { now, useToday } from '../../store/clock';
import { useData } from '../../store/data';
import { AppText, Button, Card, Icon, MoodFace, Sparkline, spacing, useTheme } from '../../ui';
import { EmotionPicker } from '../EmotionPicker';
import { MoodPicker } from '../MoodPicker';
import { QueueStatus } from '../QueueStatus';
import { interventionRoute } from '../routes';

export interface ChatCardHandlers {
  onMood: (mood: Scale5) => void;
  onEmotions: (emotions: EmotionId[]) => void;
  onSafety: (answer: boolean) => void;
}

/** Rich cards inside the conversation: they open the app's existing screens. */
export function ChatCardView({ card, active, handlers }: { card: ChatCard; active: boolean; handlers: ChatCardHandlers }) {
  switch (card.type) {
    case 'mood':
      return <MoodPicker value={null} onChange={handlers.onMood} compact disabled={!active} />;
    case 'emotions':
      return <EmotionsCard active={active} onDone={handlers.onEmotions} />;
    case 'safety':
      return <SafetyCard active={active} onAnswer={handlers.onSafety} />;
    case 'intervention':
      return <InterventionCard id={card.id} />;
    case 'plan':
      return <PlanCard />;
    case 'insights':
      return <InsightsCard />;
    case 'consult':
      return <ConsultCard />;
    case 'crisis':
      return <CrisisCard />;
    case 'entry':
      return <EntryCard checkInId={card.checkInId} />;
  }
}

function EmotionsCard({ active, onDone }: { active: boolean; onDone: (e: EmotionId[]) => void }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<EmotionId[]>([]);
  return (
    <View style={styles.gap}>
      <EmotionPicker
        selected={selected}
        disabled={!active}
        onToggle={(id) => setSelected((cur) => (cur.includes(id) ? cur.filter((e) => e !== id) : [...cur, id]))}
      />
      {active ? <Button size="md" title={selected.length ? t('common.continue') : t('chat.quick.skip')} onPress={() => onDone(selected)} /> : null}
    </View>
  );
}

function SafetyCard({ active, onAnswer }: { active: boolean; onAnswer: (a: boolean) => void }) {
  const { t } = useTranslation();
  if (!active) return null;
  return (
    <View style={[styles.row, styles.gap]}>
      <Button size="md" variant="secondary" title={t('common.no')} onPress={() => onAnswer(false)} style={styles.flex} />
      <Button size="md" variant="secondary" title={t('common.yes')} onPress={() => onAnswer(true)} style={styles.flex} />
    </View>
  );
}

function InterventionCard({ id }: { id: Parameters<typeof getIntervention>[0] }) {
  const { t } = useTranslation();
  const def = getIntervention(id);
  const route = interventionRoute(id);
  return (
    <Card tone="accent">
      <View style={styles.between}>
        <AppText variant="heading" style={styles.flex}>
          {t(`interventions.${id}.title`)}
        </AppText>
        <AppText variant="caption" tone="muted">
          {t('common.minutes', { count: def.minutes })}
        </AppText>
      </View>
      <AppText tone="muted">{t(`interventions.${id}.why`)}</AppText>
      {route ? (
        <Button size="md" variant="accent" title={t('chat.card.start')} onPress={() => router.push(route)} />
      ) : (
        <AppText>{t(`interventions.${id}.howTo`)}</AppText>
      )}
    </Card>
  );
}

function PlanCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const plan = useData((s) => s.plan);
  return (
    <Card>
      <AppText variant="label">{t('today.plan.title')}</AppText>
      {plan?.items.map((item) => (
        <View key={item.interventionId} style={styles.planRow}>
          <Icon name={item.status === 'done' ? 'check' : 'plus'} color={item.status === 'done' ? colors.success : colors.textMuted} size={18} />
          <AppText style={styles.flex}>{t(`interventions.${item.interventionId}.title`)}</AppText>
        </View>
      ))}
      <Button size="md" variant="secondary" title={t('chat.card.openDay')} onPress={() => router.push('/today')} />
    </Card>
  );
}

function InsightsCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const checkIns = useData((s) => s.checkIns);
  const today = useToday();
  const { series, trend } = useMemo(() => {
    const byDate = checkInsByDate(checkIns);
    return {
      series: lastNDates(today, 14).map((d) => byDate.get(d)?.mood ?? null),
      trend: weeklyMoodTrend(checkIns, today).trend,
    };
  }, [checkIns, today]);
  return (
    <Card>
      <AppText>{t(`today.trend.${trend}`)}</AppText>
      {trend !== 'notEnough' ? (
        <Sparkline values={series} color={colors.chartMood} min={1} max={5} accessibilityLabel={t('a11y.chart', { label: t('today.moodLabel') })} />
      ) : null}
      <Button size="md" variant="secondary" title={t('chat.card.seeTrends')} onPress={() => router.push('/insights')} />
    </Card>
  );
}

function ConsultCard() {
  const { t } = useTranslation();
  const requests = useData((s) => s.requests);
  const open = [...requests]
    .reverse()
    .find((r) => simulateQueueProgress(r.initialPosition, new Date(r.createdAt), now()).status === 'queued');
  return (
    <Card tone="soft">
      {open ? <QueueStatus request={open} /> : null}
      <Button
        size="md"
        variant={open ? 'secondary' : 'primary'}
        title={open ? t('chat.card.openCare') : t('today.suggestConsult.cta')}
        onPress={() => router.push(open ? '/care' : '/consult')}
      />
    </Card>
  );
}

function CrisisCard() {
  const { t } = useTranslation();
  return (
    <Card tone="danger">
      <Button title={t('crisis.call112')} variant="danger" onPress={() => Linking.openURL(`tel:${EMERGENCY_NUMBER}`).catch(() => undefined)} />
      <Button size="md" variant="secondary" title={t('chat.card.openHelp')} onPress={() => router.push('/crisis')} />
    </Card>
  );
}

function EntryCard({ checkInId }: { checkInId: string }) {
  const { t } = useTranslation();
  const entry = useData((s) => s.checkIns.find((c) => c.id === checkInId));
  if (!entry) return null;
  return (
    <Card>
      <View style={[styles.row, { alignItems: 'center', gap: spacing.md }]}>
        <MoodFace level={entry.mood} size={44} />
        <View style={styles.flex}>
          <AppText variant="label">{t('chat.card.savedTitle')}</AppText>
          <AppText variant="caption" tone="muted">
            {[t(`checkin.mood.levels.${entry.mood}`), ...(entry.emotions ?? []).map((e) => `${emotionEmoji(e)} ${t(`emotions.${e}`)}`)].join(' · ')}
          </AppText>
        </View>
      </View>
      <View style={[styles.row, styles.gap]}>
        <Button size="md" variant="secondary" title={t('chat.card.openJournal')} onPress={() => router.push('/journal')} style={styles.flex} />
        <Button size="md" variant="ghost" title={t('chat.card.fullCheckin')} onPress={() => router.push('/checkin')} style={styles.flex} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.sm },
  row: { flexDirection: 'row' },
  flex: { flex: 1 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
