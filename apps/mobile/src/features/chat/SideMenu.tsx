import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useData } from '../../store/data';
import { AppText, Avatar, HelpButton, Icon, MIN_TOUCH, radii, spacing, useTheme, type IconName } from '../../ui';

const ITEMS: { key: string; icon: IconName; href: Href | null }[] = [
  { key: 'chat', icon: 'chat', href: null },
  { key: 'today', icon: 'today', href: '/today' },
  { key: 'journal', icon: 'journal', href: '/journal' },
  { key: 'comfort', icon: 'comfort', href: '/comfort' },
  { key: 'insights', icon: 'insights', href: '/insights' },
  { key: 'care', icon: 'care', href: '/care' },
  { key: 'settings', icon: 'settings', href: '/settings' },
];

const PANEL_WIDTH = 300;

/** ChatGPT-style side menu: the chat is home, everything else is one tap away. */
export function SideMenu({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { colors, reduceMotion } = useTheme();
  const patient = useData((s) => s.patient);
  const x = useSharedValue(-PANEL_WIDTH);

  useEffect(() => {
    x.value = reduceMotion ? (visible ? 0 : -PANEL_WIDTH) : withTiming(visible ? 0 : -PANEL_WIDTH, { duration: 220 });
  }, [visible, reduceMotion, x]);

  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const go = (href: Href | null) => {
    onClose();
    if (href) router.push(href);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.panel, { backgroundColor: colors.background, borderRightColor: colors.border }, panelStyle]}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.fill}>
            <View style={styles.head}>
              {patient ? <Avatar species={patient.companion.species} size={44} /> : null}
              <View style={styles.fill}>
                <AppText variant="heading">{patient?.companion.name ?? t('common.appName')}</AppText>
                <AppText variant="caption" tone="muted">
                  {t('common.appName')}
                </AppText>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={t('menu.close')} onPress={onClose} hitSlop={8} style={styles.iconButton}>
                <Icon name="close" color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.items}>
              {ITEMS.map((item) => {
                const current = item.href === null;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="button"
                    accessibilityLabel={t(`menu.${item.key}`)}
                    accessibilityState={{ selected: current }}
                    onPress={() => go(item.href)}
                    style={({ pressed }) => [
                      styles.item,
                      { backgroundColor: current ? colors.primarySoft : pressed ? colors.surfaceAlt : 'transparent' },
                    ]}
                  >
                    <Icon name={item.icon} color={current ? colors.primary : colors.text} />
                    <AppText variant="label" tone={current ? 'primary' : 'default'}>
                      {t(`menu.${item.key}`)}
                    </AppText>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              <HelpButton />
              <AppText variant="caption" tone="muted">
                {t('common.notMedicalDevice')}
              </AppText>
            </View>
          </SafeAreaView>
        </Animated.View>
        <Pressable accessibilityRole="button" accessibilityLabel={t('menu.close')} style={styles.scrim} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  fill: { flex: 1 },
  panel: { width: PANEL_WIDTH, maxWidth: '86%', borderRightWidth: StyleSheet.hairlineWidth, zIndex: 2 },
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  iconButton: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  items: { paddingHorizontal: spacing.sm, gap: 2 },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH + 4, paddingHorizontal: spacing.md, borderRadius: radii.md },
  footer: { marginTop: 'auto', padding: spacing.md, gap: spacing.sm },
});
