import { router, type Href } from 'expo-router';
import { useEffect } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useData } from '../../store/data';
import {
  AppText,
  Avatar,
  FeatureCard,
  HelpButton,
  Icon,
  MIN_TOUCH,
  radii,
  spacing,
  useTheme,
  type Category,
  type IconName,
  type IllustrationName,
} from '../../ui';

/** The three places to go, as hub cards (one colour each). */
const PLACES: { key: 'progress' | 'comfort' | 'care'; href: Href; category: Category; art: IllustrationName }[] = [
  { key: 'progress', href: '/progress', category: 'night', art: 'journal' },
  { key: 'comfort', href: '/comfort', category: 'ember', art: 'fireplace' },
  { key: 'care', href: '/care', category: 'leaf', art: 'care' },
];

const PANEL_WIDTH = 320;

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

  const row = (key: string, icon: IconName, href: Href | null, current: boolean) => (
    <Pressable
      key={key}
      accessibilityRole="button"
      accessibilityLabel={t(`menu.${key}`)}
      accessibilityState={{ selected: current }}
      onPress={() => go(href)}
      style={({ pressed }) => [styles.item, { backgroundColor: current ? colors.primarySoft : pressed ? colors.surfaceAlt : 'transparent' }]}
    >
      <Icon name={icon} color={current ? colors.primary : colors.text} />
      <AppText variant="label" tone={current ? 'primary' : 'default'}>
        {t(`menu.${key}`)}
      </AppText>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.panel, { backgroundColor: colors.background }, panelStyle]}>
          <SafeAreaView edges={['top', 'bottom']} style={styles.fill}>
            <View style={styles.head}>
              {patient ? <Avatar species={patient.companion.species} size={48} /> : null}
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

            <ScrollView contentContainerStyle={styles.items} showsVerticalScrollIndicator={false}>
              {row('chat', 'chat', null, true)}
              <View style={styles.places}>
                {PLACES.map((p) => (
                  <FeatureCard
                    key={p.key}
                    size="sm"
                    title={t(`menu.${p.key}`)}
                    description={t(`menu.hints.${p.key}`)}
                    category={p.category}
                    art={p.art}
                    onPress={() => go(p.href)}
                  />
                ))}
              </View>
              {row('settings', 'settings', '/settings', false)}
            </ScrollView>

            <View style={styles.footer}>
              <HelpButton variant="full" />
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
  panel: { width: PANEL_WIDTH, maxWidth: '88%', borderTopRightRadius: radii.xl, borderBottomRightRadius: radii.xl, overflow: 'hidden', zIndex: 2 },
  scrim: { flex: 1, backgroundColor: 'rgba(43,33,28,0.4)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  iconButton: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  items: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: spacing.sm },
  places: { gap: spacing.sm, marginVertical: spacing.xs },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH + 4, paddingHorizontal: spacing.md, borderRadius: radii.pill },
  footer: { padding: spacing.md, gap: spacing.sm },
});
