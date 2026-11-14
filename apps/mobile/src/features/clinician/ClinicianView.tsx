import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EARLY_SIGNS, type EarlySign } from '../../domain/entities';
import { AppText, Card, Chip, FeatureCard, Screen, Sparkline, radii, spacing, useTheme, type Category } from '../../ui';
import type { ClinicianRow } from './clinicianViewModel';

export function ClinicianView({ rows, date, onToggleSign }: { rows: ClinicianRow[]; date: string; onToggleSign?: (personId: string, sign: EarlySign) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const compact = width < 600;
  const summary: { key: string; value: number; color: string; category: Category }[] = [
    { key: 'total', value: rows.length, color: colors.text, category: 'sky' },
    { key: 'high', value: rows.filter((r) => r.priority.level === 'high').length, color: colors.danger, category: 'rose' },
    { key: 'lost', value: rows.filter((r) => r.lostContact).length, color: colors.accent, category: 'night' },
  ];
  // Calm status colours: red only for "high"; low is green, never the brand ember.
  const look = {
    high: { color: colors.danger, soft: colors.dangerSoft },
    medium: { color: colors.warning, soft: colors.warningSoft },
    low: { color: colors.success, soft: colors.successSoft },
  };

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.content}>
        <FeatureCard
          size={compact ? 'md' : 'lg'}
          category="sky"
          art="clinic"
          title={t('clinician.title')}
          description={t('clinician.subtitle', { date })}
        />
        <View style={styles.summary}>
          {summary.map((item) => (
            <Card key={item.key} category={item.category} style={[styles.metric, compact && styles.metricCompact]}>
              <AppText variant={compact ? 'title' : 'display'} style={{ color: item.color }}>{item.value}</AppText>
              <AppText variant={compact ? 'caption' : 'label'}>{t(`clinician.summary.${item.key}`)}</AppText>
            </Card>
          ))}
        </View>
        <View style={[styles.note, compact && styles.noteCompact, { backgroundColor: colors.surfaceAlt }]}>
          <AppText variant="caption">{t('clinician.dashboardNote')}</AppText>
          <AppText variant="caption" tone="muted">{t('clinician.watch')}</AppText>
        </View>
        <View style={styles.grid}>
          {rows.map((row) => {
            const name = row.name.replace(/\s*\(synthetic\)/gi, '').trim();
            const level = row.priority.level;
            const { color, soft } = look[level];
            return (
              <Card key={row.id} style={[styles.patient, { flexBasis: wide ? '48%' : '100%' }]}>
                <View style={styles.header}>
                  <View style={[styles.initial, { backgroundColor: soft }]}>
                    <AppText variant="heading" accessibilityRole="text" style={{ color }}>{name.charAt(0)}</AppText>
                  </View>
                  <AppText variant="heading" style={styles.name}>{name}</AppText>
                  <View style={[styles.badge, { backgroundColor: soft }]}>
                    <AppText variant="label" style={{ color }}>{row.priority.score}/100 · {t(`priority.level.${level}`)}</AppText>
                  </View>
                </View>
                <View
                  accessible
                  accessibilityRole="progressbar"
                  accessibilityLabel={t('clinician.scoreLabel', { name, level: t(`priority.level.${level}`) })}
                  accessibilityValue={{ min: 0, max: 100, now: row.priority.score }}
                  style={[styles.track, { backgroundColor: colors.surfaceAlt }]}
                >
                  <View style={[styles.fill, { width: `${Math.max(row.priority.score, 3)}%`, backgroundColor: color }]} />
                </View>
                <View style={styles.reasons}>
                  {row.reasons.length ? row.reasons.map((reason) => (
                    <View key={reason} style={styles.reason}>
                      <View style={[styles.dot, { backgroundColor: color }]} />
                      <AppText variant="caption" style={styles.reasonText}>
                        {t(`clinician.reasonsText.${reason.replace('priority.reasons.', '')}`)}
                        {row.priority.clinicSigns?.includes(reason) ? <AppText variant="caption" tone="accent">{`  ·  ${t('clinician.signs.matched')}`}</AppText> : null}
                      </AppText>
                    </View>
                  )) : <AppText variant="caption" tone="muted">{t('clinician.noReasons')}</AppText>}
                </View>
                <View style={styles.body}>
                  <AppText variant="caption" tone="muted">{t('clinician.body.title')}</AppText>
                  <View style={styles.bodyRow}>
                    {([['recovery', row.body.recovery, colors.categories.ember.art, (v: number) => t('wearable.recoveryValue', { ms: Math.round(v) })], ['sleep', row.body.sleep, colors.categories.night.art, (v: number) => t('wearable.sleepValue', { hours: v.toFixed(1) })]] as const).map(([key, metric, tint, format]) => (
                      <View key={key} style={styles.bodyCell}>
                        <AppText variant="caption">{t(`clinician.body.${key}`)}</AppText>
                        <Sparkline values={metric.week} color={tint} height={36} accessibilityLabel={t('wearable.weekLabel', { metric: t(`clinician.body.${key}`) })} />
                        <AppText variant="label">
                          {metric.latest === undefined ? '–' : format(metric.latest)}
                          <AppText variant="caption" tone="muted">{metric.usual === undefined ? '' : `  ·  ${t('clinician.body.usual', { value: format(metric.usual) })}`}</AppText>
                        </AppText>
                      </View>
                    ))}
                  </View>
                </View>
                {onToggleSign ? (
                  <View style={styles.signs}>
                    <AppText variant="caption" tone="muted">{t('clinician.signs.title')}</AppText>
                    <View style={styles.signChips}>
                      {EARLY_SIGNS.map((sign) => (
                        <Chip key={sign} role="checkbox" label={t(`clinician.signs.${sign}`)} selected={row.watchedSigns.includes(sign)} onPress={() => onToggleSign(row.id, sign)} />
                      ))}
                    </View>
                  </View>
                ) : null}
                <View style={[styles.details, { backgroundColor: colors.surfaceAlt }]}>
                  <AppText variant="label">{row.latestPhq9 ? t('clinician.phq', { total: row.latestPhq9.total, date: row.latestPhq9.date }) : t('clinician.noPhq')}</AppText>
                  {row.lostContact ? (
                    <View style={[styles.badge, { backgroundColor: colors.accentSoft, alignSelf: 'flex-start' }]}>
                      <AppText variant="label" tone="accent">{t('clinician.lostContact')}</AppText>
                    </View>
                  ) : null}
                  {row.outreach === 'quiet' ? <AppText variant="caption" tone="muted">{t('clinician.quiet')}</AppText> : null}
                  <AppText variant="label" tone={row.callStatus === 'review' ? 'primary' : 'default'}>{t(`clinician.call.${row.callStatus}`)}</AppText>
                  {row.callStatus === 'pending' ? <AppText variant="caption" tone="muted">{t('clinician.pendingReason')}</AppText> : null}
                  {row.safetyRecorded ? <AppText variant="caption" tone="danger">{t('clinician.safetyRecorded')}</AppText> : null}
                </View>
              </Card>
            );
          })}
        </View>
        <AppText variant="caption" tone="muted">{t('clinician.reasonOrder')}</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { padding: spacing.md },
  content: { width: '100%', maxWidth: 1120, alignSelf: 'center', gap: spacing.md },
  summary: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  metric: { flexGrow: 1, flexBasis: 140, minWidth: 0, gap: spacing.xs, padding: spacing.md },
  metricCompact: { flexBasis: 0, flexShrink: 1, padding: spacing.sm + spacing.xs },
  noteCompact: { padding: spacing.sm + spacing.xs },
  note: { borderRadius: radii.lg, padding: spacing.md, gap: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: spacing.md },
  patient: { flexGrow: 1, minWidth: 0, gap: spacing.sm + spacing.xs, padding: spacing.md, borderRadius: radii.xl },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  initial: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  name: { flexShrink: 1, flexGrow: 1 },
  badge: { maxWidth: '100%', borderRadius: radii.pill, paddingHorizontal: spacing.sm + spacing.xs, paddingVertical: spacing.xs },
  track: { height: 10, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill },
  reasons: { gap: spacing.xs },
  reason: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },
  reasonText: { flex: 1 },
  signs: { gap: spacing.xs },
  body: { gap: spacing.xs },
  bodyRow: { flexDirection: 'row', gap: spacing.md },
  bodyCell: { flex: 1, minWidth: 0, gap: 2 },
  signChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  details: { borderRadius: radii.md, padding: spacing.sm + spacing.xs, gap: spacing.xs },
});
