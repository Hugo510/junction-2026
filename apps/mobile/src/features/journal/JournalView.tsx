import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { parseISODate } from '../../domain/dates';
import { emotionEmoji } from '../../domain/journal';
import { capitalizeFirst, formatDate } from '../../i18n';
import { AppText, Card, EmptyState, Section, radii, spacing, useTheme } from '../../ui';
import { EntryRow, MoodCalendar } from './JournalParts';
import { useJournalViewModel } from './useJournalViewModel';

/** Journal tab: days noticed (never resets), milestones, mood calendar, feelings and entries. */
export function JournalView() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const vm = useJournalViewModel();

  return (
    <View style={{ gap: spacing.lg }}>
      <Card tone="soft">
        <AppText variant="title" tone="primary">
          🌱 {t('journal.daysLogged', { count: vm.total })}
        </AppText>
        <AppText variant="caption" tone="muted">
          {t('journal.daysLoggedHint')}
        </AppText>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs }}>
          {vm.badges.map((b) => (
            <View
              key={b.days}
              accessible
              accessibilityLabel={`${t(`journal.milestone.${b.days}`)}: ${t(b.unlocked ? 'journal.unlocked' : 'journal.locked')}`}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.xs,
                borderRadius: radii.pill,
                backgroundColor: b.unlocked ? colors.primary : colors.surface,
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
          year={vm.cursor.year}
          month={vm.cursor.month}
          moodByDate={vm.moodByDate}
          selected={vm.selected}
          today={vm.today}
          onSelect={vm.toggleDay}
          onPrev={() => vm.shiftMonth(-1)}
          onNext={() => vm.shiftMonth(1)}
        />
      </Card>

      {vm.topEmotions.length > 0 ? (
        <View style={{ gap: spacing.sm }}>
          <AppText variant="label" tone="muted">
            {t('journal.topEmotions')}
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {vm.topEmotions.map((e) => (
              <View key={e.id} style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill, backgroundColor: colors.surfaceAlt }}>
                <AppText variant="caption">
                  {emotionEmoji(e.id)} {t(`emotions.${e.id}`)} · {e.count}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {vm.isEmpty ? (
        <EmptyState title={t('journal.title')} body={t('journal.empty', { name: vm.companionName })} />
      ) : (
        vm.visibleDays.map((date) => {
          const entries = vm.byDate.get(date) ?? [];
          return (
            <Section key={date} title={capitalizeFirst(formatDate(parseISODate(date), 'EEEE d MMMM'))}>
              {entries.length === 0 ? (
                <View style={{ padding: spacing.md }}>
                  <AppText tone="muted">{t('journal.noEntry')}</AppText>
                </View>
              ) : (
                entries.map((e) => <EntryRow key={e.id} entry={e} />)
              )}
            </Section>
          );
        })
      )}
    </View>
  );
}
