import { router } from 'expo-router';
import { memo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CRISIS_RESOURCES, EMERGENCY_NUMBER, displayPhone } from '../../config/crisisResources';
import type { ChatCard, QuickReplyId } from '../../domain/chat/types';
import { simulateQueueProgress } from '../../domain/consultQueue';
import type { EmotionId, InterventionId, PlanItem, Scale5 } from '../../domain/entities';
import { getIntervention } from '../../domain/interventions';
import { emotionEmoji } from '../../domain/journal';
import { now } from '../../store/clock';
import { useData } from '../../store/data';
import { useSettings } from '../../store/settings';
import { AppText, Button, Card, Icon, MIN_TOUCH, MoodFace, Sparkline, spacing, useTheme } from '../../ui';
import { EmotionPicker } from '../EmotionPicker';
import { useMoodTrend } from '../insights/useInsightsViewModel';
import { MoodPicker } from '../MoodPicker';
import { QueueStatus } from '../QueueStatus';
import { interventionRoute } from '../routes';

export interface ChatCardHandlers {
  onMood: (mood: Scale5) => void;
  onEmotions: (emotions: EmotionId[]) => void;
  onSafety: (answer: boolean) => void;
  onQuick: (id: QuickReplyId) => void;
  onPhq: (value: number) => void;
}

/**
 * Rich cards inside the conversation: one primary action each, the rest as a text link.
 * They are "results" of the chat and open the app's secondary screens.
 */
export const ChatCardView = memo(function ChatCardView({
  card,
  active,
  mood,
  handlers,
}: {
  card: ChatCard;
  active: boolean;
  /** Mood chosen in the current check-in (orders the feelings). */
  mood?: Scale5;
  handlers: ChatCardHandlers;
}) {
  switch (card.type) {
    case 'mood':
      return <MoodPicker value={null} onChange={handlers.onMood} compact disabled={!active} />;
    case 'emotions':
      return <EmotionsCard active={active} mood={mood} onDone={handlers.onEmotions} />;
    case 'safety':
      return active ? <SafetyCard onAnswer={handlers.onSafety} /> : null;
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
    case 'phq':
      return active ? <PhqCard onAnswer={handlers.onPhq} /> : null;
    case 'weekly':
      return <WeeklyCard />;
    case 'friend':
      return <FriendCard />;
    case 'reconnect':
      return <ReconnectCard onCheckIn={() => handlers.onQuick('checkin')} />;
  }
});

function EmotionsCard({ active, mood, onDone }: { active: boolean; mood?: Scale5; onDone: (e: EmotionId[]) => void }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<EmotionId[]>([]);
  return (
    <View style={styles.gap}>
      <EmotionPicker
        compact
        mood={mood}
        selected={selected}
        disabled={!active}
        onToggle={(id) => setSelected((cur) => (cur.includes(id) ? cur.filter((e) => e !== id) : [...cur, id]))}
      />
      {active ? (
        <Button size="md" variant={selected.length ? 'primary' : 'ghost'} title={selected.length ? t('common.continue') : t('chat.quick.skip')} onPress={() => onDone(selected)} />
      ) : null}
    </View>
  );
}

function SafetyCard({ onAnswer }: { onAnswer: (a: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.row, styles.gap]}>
      <Button size="md" variant="secondary" title={t('common.no')} onPress={() => onAnswer(false)} style={styles.flex} />
      <Button size="md" variant="secondary" title={t('common.yes')} onPress={() => onAnswer(true)} style={styles.flex} />
    </View>
  );
}

function InterventionCard({ id }: { id: InterventionId }) {
  const { t } = useTranslation();
  const def = getIntervention(id);
  const route = interventionRoute(id);
  return (
    <Card tone="accent" flat>
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

/** Today's plan, manageable right in the chat (done / not today, no penalty). */
function PlanRow({ item }: { item: PlanItem }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const setPlanStatus = useData((s) => s.setPlanStatus);
  const title = t(`interventions.${item.interventionId}.title`);
  const route = interventionRoute(item.interventionId);
  const pending = item.status === 'pending';
  return (
    <View style={styles.planRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityHint={route ? t('chat.card.start') : undefined}
        disabled={!route}
        onPress={() => route && router.push(route)}
        style={styles.planTitle}
      >
        <AppText tone={pending ? 'default' : 'muted'} style={!pending ? styles.strike : undefined}>
          {title}
        </AppText>
        <AppText variant="caption" tone="muted">
          {t('common.minutes', { count: getIntervention(item.interventionId).minutes })}
          {item.status === 'notToday' ? ` · ${t('today.plan.markedNotToday')}` : ''}
        </AppText>
      </Pressable>
      {pending ? (
        <>
          <Pressable accessibilityRole="button" accessibilityLabel={`${t('today.plan.notToday')}: ${title}`} onPress={() => setPlanStatus(item.interventionId, 'notToday')} style={styles.iconButton}>
            <Icon name="close" color={colors.textMuted} size={20} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`${t('today.plan.done')}: ${title}`} onPress={() => setPlanStatus(item.interventionId, 'done')} style={[styles.iconButton, { backgroundColor: colors.primarySoft }]}>
            <Icon name="check" color={colors.primary} size={20} />
          </Pressable>
        </>
      ) : (
        <Pressable accessibilityRole="button" accessibilityLabel={`${t('today.plan.undo')}: ${title}`} onPress={() => setPlanStatus(item.interventionId, 'pending')} style={styles.iconButton}>
          <Icon name={item.status === 'done' ? 'check' : 'close'} color={item.status === 'done' ? colors.success : colors.textMuted} size={20} />
        </Pressable>
      )}
    </View>
  );
}

function PlanCard() {
  const { t } = useTranslation();
  const plan = useData((s) => s.plan);
  return (
    <Card flat>
      <AppText variant="label">{t('today.plan.title')}</AppText>
      {plan?.items.map((item) => <PlanRow key={item.interventionId} item={item} />)}
    </Card>
  );
}

function InsightsCard() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { series, trend } = useMoodTrend();
  return (
    <Card flat>
      <AppText>{t(`today.trend.${trend}`)}</AppText>
      {trend !== 'notEnough' ? (
        <Sparkline values={series} color={colors.chartMood} min={1} max={5} accessibilityLabel={t('a11y.chart', { label: t('today.moodLabel') })} />
      ) : null}
      <Button size="md" variant="ghost" title={t('chat.card.seeTrends')} onPress={() => router.push({ pathname: '/progress', params: { tab: 'trends' } })} />
    </Card>
  );
}

function ConsultCard() {
  const { t } = useTranslation();
  const requests = useData((s) => s.requests);
  const open = [...requests].reverse().find((r) => simulateQueueProgress(r.initialPosition, new Date(r.createdAt), now()).status === 'queued');
  return (
    <Card tone="soft" flat>
      {open ? <QueueStatus request={open} /> : null}
      <Button
        size="md"
        variant={open ? 'ghost' : 'primary'}
        title={open ? t('chat.card.openCare') : t('today.suggestConsult.cta')}
        onPress={() => router.push(open ? '/care' : '/consult')}
      />
    </Card>
  );
}

function CrisisCard() {
  const { t } = useTranslation();
  return (
    <Card tone="danger" flat>
      <Button title={t('crisis.call112')} variant="danger" onPress={() => Linking.openURL(`tel:${EMERGENCY_NUMBER}`).catch(() => undefined)} />
      <Button size="md" variant="ghost" title={t('chat.card.openHelp')} onPress={() => router.push('/crisis')} />
    </Card>
  );
}

function EntryCard({ checkInId }: { checkInId: string }) {
  const { t } = useTranslation();
  const entry = useData((s) => s.checkIns.find((c) => c.id === checkInId));
  if (!entry) return null;
  return (
    <Card flat>
      <View style={[styles.row, { alignItems: 'center', gap: spacing.md }]}>
        <MoodFace level={entry.mood} size={44} />
        <View style={styles.flex}>
          <AppText variant="label">{t('chat.card.savedTitle')}</AppText>
          <AppText variant="caption" tone="muted">
            {[t(`checkin.mood.levels.${entry.mood}`), ...(entry.emotions ?? []).map((e) => `${emotionEmoji(e)} ${t(`emotions.${e}`)}`)].join(' · ')}
          </AppText>
        </View>
      </View>
      <Button size="md" variant="secondary" title={t('chat.card.openJournal')} onPress={() => router.push('/progress')} />
      <Button size="md" variant="ghost" title={t('chat.card.fullCheckin')} onPress={() => router.push('/checkin')} />
    </Card>
  );
}

/** The four standard PHQ answers (0–3), full-width so they are easy to tap. */
function PhqCard({ onAnswer }: { onAnswer: (value: number) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.gap} accessibilityRole="radiogroup">
      {[0, 1, 2, 3].map((value) => (
        <Button key={value} size="md" variant="secondary" title={t(`phq.options.${value}`)} onPress={() => onAnswer(value)} />
      ))}
    </View>
  );
}

/** Invitation to the longer weekly check-in (sleep, energy, tap game). */
function WeeklyCard() {
  const { t } = useTranslation();
  return (
    <Card tone="sand" flat>
      <Button size="md" variant="secondary" title={t('chat.card.weekly')} onPress={() => router.push('/checkin')} />
    </Card>
  );
}

/** One tap to someone the person trusts (stored only on the phone). */
function FriendCard() {
  const { t } = useTranslation();
  const contact = useSettings((s) => s.trustedContact);
  if (!contact) {
    return (
      <Card tone="sand" flat>
        <AppText>{t('chat.card.addFriendBody')}</AppText>
        <Button size="md" variant="secondary" title={t('chat.card.addFriend')} onPress={() => router.push('/settings')} />
      </Card>
    );
  }
  const phone = contact.phone.replace(/\s+/g, '');
  return (
    <Card tone="sand" flat>
      <Button size="md" title={t('chat.card.callFriend', { name: contact.name })} onPress={() => Linking.openURL(`tel:${phone}`).catch(() => undefined)} />
      <Button size="md" variant="ghost" title={t('chat.card.messageFriend', { name: contact.name })} onPress={() => Linking.openURL(`sms:${phone}`).catch(() => undefined)} />
    </Card>
  );
}

/** After a long silence: calm ways back in. Not crisis language; 112 is not part of this ladder. */
function ReconnectCard({ onCheckIn }: { onCheckIn: () => void }) {
  const { t } = useTranslation();
  const contact = useSettings((s) => s.trustedContact);
  const helpline = CRISIS_RESOURCES[0];
  return (
    <Card tone="accent" flat>
      <Button size="md" variant="accent" title={t('chat.card.reconnectCheckin')} onPress={onCheckIn} />
      <Button size="md" variant="secondary" title={t('chat.card.reconnectCare')} onPress={() => router.push('/consult')} />
      {contact ? (
        <Button size="md" variant="ghost" title={t('chat.card.callFriend', { name: contact.name })} onPress={() => Linking.openURL(`tel:${contact.phone.replace(/\s+/g, '')}`).catch(() => undefined)} />
      ) : null}
      <Button
        size="md"
        variant="ghost"
        title={t('chat.card.reconnectHelpline', { number: displayPhone(helpline.phone) })}
        onPress={() => Linking.openURL(`tel:${helpline.phone}`).catch(() => undefined)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  gap: { gap: spacing.sm },
  row: { flexDirection: 'row' },
  flex: { flex: 1 },
  between: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  planTitle: { flex: 1, minHeight: MIN_TOUCH, justifyContent: 'center' },
  strike: { textDecorationLine: 'line-through' },
  iconButton: { width: MIN_TOUCH, height: MIN_TOUCH, borderRadius: MIN_TOUCH / 2, alignItems: 'center', justifyContent: 'center' },
});
