import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { parseISODate, type ISODate } from '../../domain/dates';
import type { CheckIn, Scale5 } from '../../domain/entities';
import { emotionEmoji, monthGrid } from '../../domain/journal';
import { capitalizeFirst, formatDate } from '../../i18n';
import { AppText, Icon, MIN_TOUCH, MoodFace, radii, spacing, useTheme } from '../../ui';

/** Same palette as MoodFace, for calendar dots. */
export const MOOD_COLORS: Record<Scale5, string> = {
  1: '#C9C6E8',
  2: '#D6D9EE',
  3: '#E6E1D3',
  4: '#CFE3D4',
  5: '#B5D8BF',
};

/** A Monday used to print localized weekday initials. */
const A_MONDAY = '2026-11-16';

export function MoodCalendar({
  year,
  month,
  moodByDate,
  selected,
  today,
  onSelect,
  onPrev,
  onNext,
}: {
  year: number;
  month: number;
  moodByDate: Map<ISODate, Scale5>;
  selected: ISODate | null;
  today: ISODate;
  onSelect: (d: ISODate) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const weeks = monthGrid(year, month);
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = parseISODate(A_MONDAY);
    d.setDate(d.getDate() + i);
    return formatDate(d, 'EEEEE').toUpperCase();
  });

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={styles.monthRow}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('journal.prevMonth')} onPress={onPrev} style={styles.navButton}>
          <Icon name="chevronLeft" color={colors.text} />
        </Pressable>
        <AppText variant="heading">
          {capitalizeFirst(formatDate(new Date(year, month, 1, 12), 'LLLL yyyy'))}
        </AppText>
        <Pressable accessibilityRole="button" accessibilityLabel={t('journal.nextMonth')} onPress={onNext} style={styles.navButton}>
          <Icon name="chevronRight" color={colors.text} />
        </Pressable>
      </View>
      <View style={styles.week}>
        {weekdays.map((w, i) => (
          <AppText key={i} variant="caption" tone="muted" align="center" style={styles.cell}>
            {w}
          </AppText>
        ))}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={styles.week}>
          {week.map((date, di) => {
            if (!date) return <View key={di} style={styles.cell} />;
            const mood = moodByDate.get(date);
            const isSelected = selected === date;
            const label = `${formatDate(parseISODate(date), 'EEEE d MMMM')}: ${mood ? t(`checkin.mood.levels.${mood}`) : t('journal.noEntry')}`;
            return (
              <Pressable
                key={di}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(date)}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: mood ? MOOD_COLORS[mood] : 'transparent',
                      borderColor: isSelected ? colors.primary : date === today ? colors.accent : mood ? 'transparent' : colors.border,
                      borderWidth: isSelected || date === today ? 2 : 1,
                    },
                  ]}
                >
                  <AppText variant="caption" style={{ color: mood ? '#2B2B2B' : colors.textMuted }}>
                    {Number(date.slice(8))}
                  </AppText>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function EntryRow({ entry }: { entry: CheckIn }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const kind = entry.kind ?? 'full';
  return (
    <View style={[styles.entry, { borderColor: colors.border }]}>
      <MoodFace level={entry.mood} size={40} />
      <View style={{ flex: 1, gap: 2 }}>
        <View style={styles.entryHead}>
          <AppText variant="label">{t(`checkin.mood.levels.${entry.mood}`)}</AppText>
          <AppText variant="caption" tone="muted">
            {formatDate(new Date(entry.createdAt), 'HH:mm')} · {t(`journal.kind.${kind}`)}
          </AppText>
        </View>
        {entry.emotions?.length ? (
          <AppText variant="caption">{entry.emotions.map((e) => `${emotionEmoji(e)} ${t(`emotions.${e}`)}`).join('  ')}</AppText>
        ) : null}
        {entry.note ? (
          <AppText variant="caption" tone="muted" numberOfLines={3}>
            “{entry.note}”
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  week: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  dot: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  entry: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderRadius: radii.sm },
  entryHead: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, flexWrap: 'wrap' },
});
