import { router, type Href } from 'expo-router';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { QuickReplyId } from '../../domain/chat/types';
import { AppText, elevation, Icon, MIN_TOUCH, radii, spacing, useTheme, type IconName } from '../../ui';

type Action = { key: string; icon: IconName; label: string } & ({ quick: QuickReplyId } | { href: Href });

/** Bottom sheet with the main actions, always one tap away from the composer. */
export function ActionSheet({ visible, onClose, onQuick }: { visible: boolean; onClose: () => void; onQuick: (id: QuickReplyId) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const actions: Action[] = [
    { key: 'checkin', icon: 'checkin', label: t('chat.quick.checkin'), quick: 'checkin' },
    { key: 'journal', icon: 'journal', label: t('chat.actions.journal'), href: '/journal/new' },
    { key: 'relax', icon: 'comfort', label: t('chat.quick.relax'), quick: 'relax' },
    { key: 'plan', icon: 'today', label: t('chat.quick.plan'), quick: 'plan' },
    { key: 'care', icon: 'care', label: t('chat.quick.care'), quick: 'care' },
    { key: 'full', icon: 'insights', label: t('chat.actions.fullCheckin'), href: '/checkin' },
  ];

  const run = (a: Action) => {
    onClose();
    if ('quick' in a) onQuick(a.quick);
    else router.push(a.href);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityRole="button" accessibilityLabel={t('common.close')} style={styles.scrim} onPress={onClose} />
      <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: colors.background }, elevation.high]}>
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <AppText variant="label" tone="muted" style={styles.title}>
          {t('chat.actions.title')}
        </AppText>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            accessibilityRole="button"
            accessibilityLabel={a.label}
            onPress={() => run(a)}
            style={({ pressed }) => [styles.item, pressed && { backgroundColor: colors.surfaceAlt }]}
          >
            <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
              <Icon name={a.icon} color={colors.primary} size={20} />
            </View>
            <AppText variant="label">{a.label}</AppText>
          </Pressable>
        ))}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  sheet: { borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg, paddingHorizontal: spacing.sm, paddingBottom: spacing.md },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: spacing.sm },
  title: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH + 8, paddingHorizontal: spacing.md, borderRadius: radii.md },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
