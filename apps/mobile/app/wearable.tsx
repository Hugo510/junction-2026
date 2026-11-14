import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { simulateWearable, wearableSummary, WEARABLE_DEVICES, type WearableDevice, type WearableMetric } from '../src/domain/wearable';
import { haptics } from '../src/services/haptics';
import { useBackend } from '../src/store/backend';
import { useToday } from '../src/store/clock';
import { useData } from '../src/store/data';
import { useWearable } from '../src/store/wearable';
import { AppText, BarChart, Button, Card, Chip, ChipGroup, FeatureCard, Icon, Illustration, Screen, Sparkline, radii, spacing, useTheme, type Category } from '../src/ui';

type Phase = 'idle' | 'searching' | 'found';

/** One expanding ring of the "looking for your device" animation. */
function Ring({ delay, color, active }: { delay: number; color: string; active: boolean }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    if (!active) {
      progress.value = 0;
      return;
    }
    progress.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1));
    return () => cancelAnimation(progress);
  }, [active, delay, progress]);
  const style = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - progress.value), transform: [{ scale: 0.55 + progress.value * 0.9 }] }));
  return <Animated.View style={[styles.ring, { borderColor: color }, style]} />;
}

function Metric({ label, value, usual, category, children }: { label: string; value: string; usual: string; category: Category; children: React.ReactNode }) {
  return (
    <Card category={category} style={styles.metric}>
      <AppText variant="label">{label}</AppText>
      <AppText variant="display" accessibilityRole="text">
        {value}
      </AppText>
      {children}
      <AppText variant="caption" tone="muted">
        {usual}
      </AppText>
    </Card>
  );
}

/**
 * Wearable connection — SIMULATED for the demo (no real device is paired, values are synthetic).
 * Connecting is the consent; disconnecting stops using the data at once.
 */
export default function WearableScreen() {
  const { t } = useTranslation();
  const { colors, reduceMotion } = useTheme();
  const device = useWearable((s) => s.device);
  const connect = useWearable((s) => s.connect);
  const disconnect = useWearable((s) => s.disconnect);
  const checkIns = useData((s) => s.checkIns);
  const sensors = useData((s) => s.sensors);
  const today = useToday();
  const [choice, setChoice] = useState<WearableDevice>('watch');
  const [phase, setPhase] = useState<Phase>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const days = useMemo(() => simulateWearable({ checkIns, sensors, today }), [checkIns, sensors, today]);
  const summary = useMemo(() => wearableSummary(days, today), [days, today]);

  const start = () => {
    haptics.tap();
    setPhase('searching');
    timers.current.push(
      setTimeout(() => setPhase('found'), reduceMotion ? 400 : 2200),
      setTimeout(
        () => {
          connect(choice);
          haptics.confirm();
          setPhase('idle');
          // Optional copy for the backend (daily totals only). Never blocks the app.
          useBackend.getState().mirrorWearable(days.slice(-7), true);
        },
        reduceMotion ? 800 : 3400,
      ),
    );
  };

  const stop = () => {
    disconnect();
    useBackend.getState().mirrorWearable([], false);
  };

  const usual = (m: WearableMetric, format: (v: number) => string) => (m.usual === undefined ? t('wearable.noUsual') : t('wearable.usual', { value: format(m.usual) }));
  const hours = (v: number) => t('wearable.sleepValue', { hours: v.toFixed(1) });
  const bpm = (v: number) => t('wearable.heartValue', { bpm: Math.round(v) });
  const count = (v: number) => Math.round(v).toLocaleString();

  if (!device) {
    const busy = phase !== 'idle';
    // Mid-sentence ("Looking for your ring…"), so lower case.
    const name = t(`wearable.devices.${choice}`).toLocaleLowerCase();
    return (
      <Screen footer={<Button title={t('wearable.connect')} onPress={start} disabled={busy} loading={busy} />}>
        <FeatureCard category="sky" art="watch" title={t('wearable.title')} description={t('wearable.intro')} />
        <Card tone="accent" flat>
          <View style={styles.row}>
            <Icon name="info" color={colors.accent} size={20} />
            <AppText variant="caption" style={styles.fill}>
              {t('wearable.simulated')}
            </AppText>
          </View>
        </Card>

        {busy ? (
          <View style={styles.pairing} accessible accessibilityLiveRegion="polite" accessibilityLabel={t(phase === 'found' ? 'wearable.found' : 'wearable.searching', { device: name })}>
            <View style={styles.rings}>
              {[0, 600, 1200].map((d) => (
                <Ring key={d} delay={d} color={colors.categories.sky.art} active={!reduceMotion && phase === 'searching'} />
              ))}
              <Illustration name="watch" category="sky" size={96} />
            </View>
            <AppText variant="heading" align="center">
              {t(phase === 'found' ? 'wearable.found' : 'wearable.searching', { device: name })}
            </AppText>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            <AppText variant="heading">{t('wearable.choose')}</AppText>
            <ChipGroup>
              {WEARABLE_DEVICES.map((d) => (
                <Chip key={d} label={t(`wearable.devices.${d}`)} selected={choice === d} onPress={() => setChoice(d)} />
              ))}
            </ChipGroup>
            <AppText variant="caption" tone="muted">
              {t('wearable.reads')}
            </AppText>
          </View>
        )}
      </Screen>
    );
  }

  return (
    <Screen footer={<Button title={t('wearable.disconnect')} variant="secondary" onPress={stop} />}>
      <Card category="leaf">
        <View style={styles.row}>
          <Icon name="check" color={colors.success} />
          <View style={styles.fill}>
            <AppText variant="heading">{t(`wearable.devices.${device}`)}</AppText>
            <AppText variant="caption" tone="muted">
              {t('wearable.connected')}
            </AppText>
          </View>
        </View>
      </Card>

      <Metric category="night" label={t('wearable.sleep')} value={summary.sleep.latest === undefined ? '–' : hours(summary.sleep.latest)} usual={usual(summary.sleep, hours)}>
        <BarChart values={summary.sleep.week} color={colors.categories.night.art} height={56} max={10} accessibilityLabel={t('wearable.weekLabel', { metric: t('wearable.sleep') })} />
      </Metric>
      <Metric category="leaf" label={t('wearable.steps')} value={summary.steps.latest === undefined ? '–' : count(summary.steps.latest)} usual={usual(summary.steps, count)}>
        <BarChart values={summary.steps.week} color={colors.categories.leaf.art} height={56} accessibilityLabel={t('wearable.weekLabel', { metric: t('wearable.steps') })} />
      </Metric>
      <Metric category="rose" label={t('wearable.heart')} value={summary.heart.latest === undefined ? '–' : bpm(summary.heart.latest)} usual={usual(summary.heart, bpm)}>
        <Sparkline values={summary.heart.week} color={colors.categories.rose.art} height={48} accessibilityLabel={t('wearable.weekLabel', { metric: t('wearable.heart') })} />
      </Metric>

      <AppText variant="caption" tone="muted">
        {t('wearable.use')}
      </AppText>
      <AppText variant="caption" tone="muted">
        {t('wearable.simulated')}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fill: { flex: 1 },
  pairing: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  rings: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 200, height: 200, borderRadius: 100, borderWidth: 3 },
  metric: { gap: spacing.xs, borderRadius: radii.xl },
});
