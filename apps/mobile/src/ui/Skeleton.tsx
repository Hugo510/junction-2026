import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useTheme } from './theme';
import { durations, radii, spacing } from './tokens';

function Block({ width, height, round = false }: { width: DimensionValue; height: number; round?: boolean }) {
  const { colors } = useTheme();
  return <View style={{ width, height, borderRadius: round ? height / 2 : radii.sm, backgroundColor: colors.surfaceAlt }} />;
}

/** Startup placeholder shaped like the chat, so the app feels instant instead of showing a spinner. */
export function AppSkeleton() {
  const { t } = useTranslation();
  const { colors, reduceMotion } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;
    opacity.value = withRepeat(withTiming(0.55, { duration: durations.slow * 1.5 }), -1, true);
    return () => cancelAnimation(opacity);
  }, [reduceMotion, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]} accessible accessibilityLabel={t('common.loading')} accessibilityRole="progressbar">
      <Animated.View style={[styles.fill, style]}>
        <View style={styles.header}>
          <Block width={32} height={32} round />
          <Block width={120} height={18} />
        </View>
        <View style={styles.hero}>
          <Block width={88} height={88} round />
          <Block width={140} height={20} />
          <Block width={220} height={14} />
        </View>
        <View style={styles.lines}>
          <Block width="80%" height={16} />
          <Block width="60%" height={16} />
        </View>
        <View style={styles.composer}>
          <Block width="100%" height={52} round />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1, padding: spacing.md, paddingTop: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hero: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl },
  lines: { gap: spacing.sm, marginTop: spacing.xl },
  composer: { marginTop: 'auto' },
});
