import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { parseISODate, type ISODate } from '../../src/domain/dates';
import type { Scale5 } from '../../src/domain/entities';
import { daysLogged, emotionCounts, emotionEmoji, entriesByDate, milestones } from '../../src/domain/journal';
import { EntryRow, MoodCalendar } from '../../src/features/journal/JournalParts';
import { capitalizeFirst, formatDate } from '../../src/i18n';
import { useToday } from '../../src/store/clock';
import { useData } from '../../src/store/data';
import { AppText, Button, Card, EmptyState, Screen, spacing, useTheme } from '../../src/ui';

/** Emotional journal: kind consistency (days noticed never reset), mood calendar, feelings, entries. */
export default function JournalScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const today = useToday();
  const checkIns = useData((s) => s.checkIns);
  const patient = useData((s) => s.patient);
  const todayDate = parseISODate(today);
  const [cursor, setCursor] = useState({ year: todayDate.getFullYear(), month: todayDate.getMonth() });
  const [selected, setSelected] = useState<ISODate | null>(null);

  const { total, badges, top, byDate, moodByDate } = useMemo(() => {
    const grouped = entriesByDate(checkIns);
    const moods = new Map<ISODate, Scale5>();
    grouped.forEach((entries, date) => moods.set(date, entries[0].mood));
    return {
      total: daysLogged(checkIns),
      badges: milestones(checkIns),
      top: emotionCounts(checkIns, today).slice(0, 6),
      byDate: grouped,
      moodByDate: moods,
    };
  }, [checkIns, today]);

  const shiftMonth = (delta: number) =>
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  const visibleDays = selected ? [selected] : [...byDate.keys()].slice(0, 10);

  return (
    <Screen footer={<Button title={t('journal.add')} onPress={() => router.push('/journal/new')} />}>
      <AppText tone="muted">{t('journal.subtitle')}</AppText>

      <Card tone="soft">
        <AppText variant="display" tone="primary">
          🌱 {t('journal.daysLogged', { count: total })}
        </AppText>
        <AppText variant="caption" tone="muted">
          {t('journal.daysLoggedHint')}
        </AppText>
        <AppText variant="label" style={{ marginTop: spacing.sm }}>
          {t('journal.milestonesTitle')}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {badges.map((b) => (
            <View
              key={b.days}
              accessible
              accessibilityLabel={`${t(`journal.milestone.${b.days}`)}: ${t(b.unlocked ? 'journal.unlocked' : 'journal.locked')}`}
              style={{
                paddingHorizontal: spacing.sm + 2,
                paddingVertical: spacing.xs + 2,
                borderRadius: 999,
                backgroundColor: b.unlocked ? colors.primary : colors.surface,
                borderWidth: 1,
                borderColor: b.unlocked ? colors.primary : colors.border,
              }}
            >
              <AppText variant="caption" tone={b.unlocked ? 'onPrimary' : 'muted'}>
                {b.unlocked ? '✓ ' : ''}
                {t(`journal.milestone.${b.days}`)}
              </AppText>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <MoodCalendar
          year={cursor.year}
          month={cursor.month}
          moodByDate={moodByDate}
          selected={selected}
          today={today}
          onSelect={(d) => setSelected((cur) => (cur === d ? null : d))}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
        />
      </Card>

      <Card>
        <AppText variant="heading">{t('journal.topEmotions')}</AppText>
        {top.length === 0 ? (
          <AppText tone="muted">{t('journal.noEmotions')}</AppText>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {top.map((e) => (
              <View key={e.id} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs + 2, borderRadius: 999, backgroundColor: colors.surfaceAlt }}>
                <AppText variant="caption">
                  {emotionEmoji(e.id)} {t(`emotions.${e.id}`)} · {e.count}
                </AppText>
              </View>
            ))}
          </View>
        )}
      </Card>

      {checkIns.length === 0 ? (
        <EmptyState title={t('journal.title')} body={t('journal.empty', { name: patient?.companion.name ?? '' })} />
      ) : (
        <Card>
          <AppText variant="heading">
            {selected ? t('journal.dayTitle', { date: formatDate(parseISODate(selected), 'EEEE d MMMM') }) : t('journal.entries')}
          </AppText>
          {visibleDays.map((date) => {
            const entries = byDate.get(date) ?? [];
            return (
              <View key={date} style={{ gap: spacing.xs }}>
                {!selected ? (
                  <AppText variant="caption" tone="muted" style={{ marginTop: spacing.sm }}>
                    {capitalizeFirst(formatDate(parseISODate(date), 'EEEE d MMMM'))}
                  </AppText>
                ) : null}
                {entries.length === 0 ? <AppText tone="muted">{t('journal.noEntry')}</AppText> : entries.map((e) => <EntryRow key={e.id} entry={e} />)}
              </View>
            );
          })}
        </Card>
      )}
    </Screen>
  );
}
