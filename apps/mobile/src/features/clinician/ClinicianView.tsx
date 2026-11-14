import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText, Card, Screen, radii, spacing, useTheme } from '../../ui';
import type { ClinicianRow } from './clinicianViewModel';

export function ClinicianView({ rows, date }: { rows: ClinicianRow[]; date: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  const compact = width < 600;
  const summary = [
    { key: 'total', value: rows.length, color: colors.text },
    { key: 'high', value: rows.filter((r) => r.priority.level === 'high').length, color: colors.danger },
    { key: 'lost', value: rows.filter((r) => r.lostContact).length, color: colors.accent },
  ];

  return (
    <Screen contentStyle={styles.screen}>
      <View style={styles.content}>
        <AppText variant="caption" tone="muted">{t('clinician.subtitle', { date })}</AppText>
        <View style={styles.summary}>
          {summary.map((item) => (
            <Card key={item.key} flat style={[styles.metric, compact && styles.metricCompact]}>
              <AppText variant={compact ? "heading" : "title"} style={{ color: item.color }}>{item.value}</AppText>
              <AppText variant={compact ? "caption" : "label"}>{t(`clinician.summary.${item.key}`)}</AppText>
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
            const color = level === 'high' ? colors.danger : level === 'medium' ? colors.accent : colors.primary;
            const soft = level === 'high' ? colors.dangerSoft : level === 'medium' ? colors.accentSoft : colors.primarySoft;
            return (
              <Card key={row.id} style={[styles.patient, { flexBasis: wide ? '48%' : '100%', borderLeftColor: color }]}>
                <View style={styles.header}>
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
                  style={[styles.track, { backgroundColor: colors.border }]}
                >
                  <View style={[styles.fill, { width: `${row.priority.score}%`, backgroundColor: color }]} />
                </View>
                <View style={styles.reasons}>
                  {row.reasons.length ? row.reasons.map((reason) => (
                    <AppText variant="caption" key={reason}>• {t(`clinician.reasonsText.${reason.replace('priority.reasons.', '')}`)}</AppText>
                  )) : <AppText variant="caption" tone="muted">{t('clinician.noReasons')}</AppText>}
                </View>
                <View style={[styles.details, { borderTopColor: colors.border }]}>
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
  metricCompact: { flexBasis: 0, flexShrink: 1, padding: spacing.sm },
  noteCompact: { padding: spacing.sm },
  note: { borderRadius: radii.md, padding: spacing.md, gap: spacing.xs },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', gap: spacing.md },
  patient: { flexGrow: 1, minWidth: 0, borderLeftWidth: 4, gap: spacing.sm, padding: spacing.md },
  header: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  name: { flexShrink: 1 },
  badge: { maxWidth: '100%', borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  track: { height: 6, borderRadius: radii.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radii.pill },
  reasons: { gap: spacing.xs },
  details: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm, gap: spacing.xs },
});
