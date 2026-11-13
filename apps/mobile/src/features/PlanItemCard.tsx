import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { PlanItem } from '../domain/entities';
import { getIntervention } from '../domain/interventions';
import { useData } from '../store/data';
import { AppText, Button, Icon, spacing, useTheme } from '../ui';
import { interventionRoute } from './routes';

/** One small action of today's plan. "Not today" carries no penalty. */
export function PlanItemCard({ item }: { item: PlanItem }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const setPlanStatus = useData((s) => s.setPlanStatus);
  const def = getIntervention(item.interventionId);
  const route = interventionRoute(item.interventionId);
  const title = t(`interventions.${item.interventionId}.title`);

  return (
    <View style={[styles.item, { borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="label">{title}</AppText>
          <AppText variant="caption" tone="muted">
            {t('common.minutes', { count: def.minutes })} · {t(`interventions.${item.interventionId}.why`)}
          </AppText>
          {!def.guided ? <AppText variant="caption">{t(`interventions.${item.interventionId}.howTo`)}</AppText> : null}
        </View>
        {item.status === 'done' ? <Icon name="check" color={colors.success} /> : null}
      </View>

      {item.status === 'pending' ? (
        <View style={styles.actions}>
          {route ? <Button size="md" title={t('today.plan.open')} variant="accent" onPress={() => router.push(route)} accessibilityLabel={`${t('today.plan.open')}: ${title}`} /> : null}
          <Button size="md" title={t('today.plan.done')} variant="secondary" onPress={() => setPlanStatus(item.interventionId, 'done')} accessibilityLabel={`${t('today.plan.done')}: ${title}`} haptic />
          <Button size="md" title={t('today.plan.notToday')} variant="ghost" onPress={() => setPlanStatus(item.interventionId, 'notToday')} accessibilityLabel={`${t('today.plan.notToday')}: ${title}`} />
        </View>
      ) : (
        <View style={styles.statusRow}>
          <AppText variant="caption" tone={item.status === 'done' ? 'primary' : 'muted'}>
            {item.status === 'done' ? t('today.plan.markedDone') : t('today.plan.markedNotToday')}
          </AppText>
          <Button size="md" title={t('today.plan.undo')} variant="ghost" onPress={() => setPlanStatus(item.interventionId, 'pending')} accessibilityLabel={`${t('today.plan.undo')}: ${title}`} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  item: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md, gap: spacing.sm },
  header: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
