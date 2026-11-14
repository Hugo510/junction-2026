import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { personalTrends, type TrendSignal } from '../src/domain/priorityScore';
import { useSensorsWithWearable } from '../src/features/usePriority';
import { formatDate } from '../src/i18n';
import { useToday } from '../src/store/clock';
import { useData } from '../src/store/data';
import { AppText, Card, FeatureCard, Icon, Screen, Sparkline, radii, spacing, useTheme } from '../src/ui';

const SIGNALS: TrendSignal[] = ['mood', 'activity', 'home', 'screenOff'];
/** 0 = during treatment (with the clinic, not in this app yet), 4 = ongoing updates. */
const PHASES = [0, 1, 2, 3, 4] as const;

/**
 * "Your normal": how Hiillos builds each person's own baseline, in the phases of
 * docs/research/baseline_design.md, and where each signal's smoothed trend stands today.
 */
export default function BaselineScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const checkIns = useData((s) => s.checkIns);
  const phq9 = useData((s) => s.phq9);
  const sensors = useSensorsWithWearable();
  const today = useToday();
  const { reference, trends, variabilityReady } = useMemo(() => personalTrends({ checkIns, sensors, phq9, today }), [checkIns, sensors, phq9, today]);

  const day = (iso: string) => formatDate(new Date(`${iso}T12:00:00`), 'd MMM');
  const first = reference.blocks[0];
  const last = reference.blocks[reference.blocks.length - 1];
  const share = Math.round(reference.personalShare * 100);

  return (
    <Screen>
      <FeatureCard category="ember" art="trends" title={t('baseline.title')} description={t('baseline.intro')} />
      <Card tone="accent" flat>
        <View style={styles.row}>
          <Icon name="info" color={colors.accent} size={20} />
          <AppText variant="caption" style={styles.fill}>
            {t('baseline.simulated')}
          </AppText>
        </View>
      </Card>

      <View style={styles.block}>
        <AppText variant="heading">{t('baseline.phasesTitle', { count: reference.daysOfData })}</AppText>
        {PHASES.map((phase) => {
          const current = phase === reference.phase;
          const done = phase >= 1 && phase < reference.phase;
          return (
            <View
              key={phase}
              accessible
              accessibilityLabel={`${t(`baseline.phases.${phase}.title`)}. ${t(`baseline.phases.${phase}.body`)}${current ? `. ${t('baseline.now')}` : ''}`}
              style={[styles.phase, { borderColor: current ? colors.primary : colors.border, backgroundColor: current ? colors.primarySoft : colors.surface }]}
            >
              <View style={[styles.badge, { backgroundColor: current ? colors.primary : done ? colors.accentSoft : colors.surfaceAlt }]}>
                {done ? <Icon name="check" color={colors.text} size={16} /> : <AppText variant="label" tone={current ? 'onPrimary' : 'muted'}>{phase === 4 ? '∞' : phase}</AppText>}
              </View>
              <View style={styles.fill}>
                <AppText variant="label" tone={current ? 'primary' : 'default'}>
                  {t(`baseline.phases.${phase}.title`)}
                  {current ? ` · ${t('baseline.now')}` : ''}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {t(`baseline.phases.${phase}.body`)}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>

      <Card>
        <AppText variant="label">{t('baseline.shareTitle')}</AppText>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={t('baseline.share', { percent: share })}
          accessibilityValue={{ min: 0, max: 100, now: share }}
          style={[styles.track, { backgroundColor: colors.surfaceAlt }]}
        >
          <View style={[styles.fillBar, { width: `${Math.max(share, 4)}%`, backgroundColor: colors.cta }]} />
        </View>
        <AppText variant="caption" tone="muted">
          {t('baseline.share', { percent: share })}
        </AppText>
      </Card>

      <Card>
        <AppText variant="label">{t('baseline.referenceTitle')}</AppText>
        <AppText>
          {first && last ? t('baseline.reference', { start: day(first.start), end: day(last.end), count: reference.days.length }) : t('baseline.learning')}
        </AppText>
        <AppText variant="caption" tone="muted">
          {t('baseline.referenceRule')}
        </AppText>
      </Card>

      <View style={styles.block}>
        <AppText variant="heading">{t('baseline.trendsTitle')}</AppText>
        <AppText variant="caption" tone="muted">
          {t('baseline.trendsHint')}
        </AppText>
        {SIGNALS.filter((key) => trends[key]).length === 0 ? (
          <AppText tone="muted">{t('baseline.learning')}</AppText>
        ) : (
          SIGNALS.map((key) => {
            const trend = trends[key];
            if (!trend) return null;
            const status = trend.triggered ? t('baseline.outside', { count: trend.outsideDays }) : t('baseline.inside');
            return (
              <Card key={key}>
                <AppText variant="label">{t(`baseline.signals.${key}`)}</AppText>
                <Sparkline
                  values={trend.points}
                  color={trend.triggered ? colors.primary : colors.chartSleep}
                  height={48}
                  min={-3}
                  max={3}
                  accessibilityLabel={`${t(`baseline.signals.${key}`)}. ${status}`}
                />
                <AppText variant="caption" tone={trend.triggered ? 'primary' : 'muted'}>
                  {status}
                </AppText>
              </Card>
            );
          })
        )}
        <AppText variant="caption" tone="muted">
          {t(variabilityReady ? 'baseline.variabilityOn' : 'baseline.variabilityLearning')}
        </AppText>
      </View>

      <AppText variant="caption" tone="muted">
        {t('baseline.note')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fill: { flex: 1 },
  block: { gap: spacing.sm },
  phase: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.md, borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth * 2 },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  track: { height: 10, borderRadius: radii.pill, overflow: 'hidden' },
  fillBar: { height: '100%', borderRadius: radii.pill },
});
