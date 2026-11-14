import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { ExerciseShell } from '../../src/features/ExerciseShell';
import { haptics } from '../../src/services/haptics';
import { AppText, Button, Chip, ChipGroup, spacing, useScreenFocused, useTheme } from '../../src/ui';

type Phase = 'inhale' | 'hold' | 'exhale' | 'holdOut';
type PatternId = 'box' | 'calm';

const PATTERNS: Record<PatternId, { phase: Phase; seconds: number }[]> = {
  box: [
    { phase: 'inhale', seconds: 4 },
    { phase: 'hold', seconds: 4 },
    { phase: 'exhale', seconds: 4 },
    { phase: 'holdOut', seconds: 4 },
  ],
  calm: [
    { phase: 'inhale', seconds: 4 },
    { phase: 'exhale', seconds: 6 },
  ],
};
const DURATIONS = [1, 2, 5];

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function BreathingScreen() {
  const { t } = useTranslation();
  const { colors, reduceMotion } = useTheme();
  const [pattern, setPattern] = useState<PatternId>('box');
  const [minutes, setMinutes] = useState(2);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const scale = useSharedValue(0.6);
  const focused = useScreenFocused();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const steps = PATTERNS[pattern];
  const current = steps[phaseIndex % steps.length];

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  useEffect(() => () => clear(), []);

  // Leaving the screen stops the session (no haptics in the background).
  useEffect(() => {
    if (!focused) {
      clear();
      setRunning(false);
    }
  }, [focused]);

  // Countdown
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          setFinished(true);
          haptics.confirm();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // Phase loop + animation + haptics
  useEffect(() => {
    if (!running) {
      cancelAnimation(scale);
      return;
    }
    const step = steps[phaseIndex % steps.length];
    const target = step.phase === 'inhale' ? 1 : step.phase === 'exhale' ? 0.6 : scale.value;
    if (!reduceMotion) {
      scale.value = withTiming(target, { duration: step.seconds * 1000, easing: Easing.inOut(Easing.quad) });
    } else {
      scale.value = target;
    }
    if (step.phase === 'inhale' || step.phase === 'exhale') haptics.pulse();
    const id = setTimeout(() => setPhaseIndex((i) => i + 1), step.seconds * 1000);
    timers.current.push(id);
    return () => clearTimeout(id);
  }, [running, phaseIndex, steps, reduceMotion, scale]);

  const start = () => {
    clear();
    setFinished(false);
    setPhaseIndex(0);
    setRemaining(minutes * 60);
    scale.value = 0.6;
    setRunning(true);
  };

  const stop = () => {
    clear();
    setRunning(false);
  };

  const circleStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const phaseLabel = current.phase === 'inhale' ? t('comfort.breathing.inhale') : current.phase === 'exhale' ? t('comfort.breathing.exhale') : t('comfort.breathing.hold');

  return (
    <ExerciseShell id="breathing" showFeedback={finished}>
      {!running ? (
        <View style={{ gap: spacing.md }}>
          <AppText variant="label">{t('comfort.breathing.pattern')}</AppText>
          <ChipGroup>
            <Chip label={t('comfort.breathing.box')} selected={pattern === 'box'} onPress={() => setPattern('box')} />
            <Chip label={t('comfort.breathing.calm')} selected={pattern === 'calm'} onPress={() => setPattern('calm')} />
          </ChipGroup>
          <AppText variant="label">{t('comfort.breathing.duration')}</AppText>
          <ChipGroup>
            {DURATIONS.map((m) => (
              <Chip key={m} label={t('common.minutes', { count: m })} selected={minutes === m} onPress={() => setMinutes(m)} />
            ))}
          </ChipGroup>
        </View>
      ) : null}

      <View style={styles.stage}>
        <Animated.View style={[styles.circle, { backgroundColor: colors.primarySoft, borderColor: colors.primary }, circleStyle]} />
        <View style={styles.label} pointerEvents="none">
          <AppText variant="title" align="center" accessibilityLiveRegion="assertive">
            {running ? phaseLabel : finished ? t('comfort.breathing.finished') : ''}
          </AppText>
          {running ? (
            <AppText tone="muted" align="center">
              {t('comfort.breathing.remaining', { time: fmt(remaining) })}
            </AppText>
          ) : null}
        </View>
      </View>

      {running ? <Button title={t('common.stop')} variant="secondary" onPress={stop} /> : <Button title={t('common.start')} onPress={start} />}
    </ExerciseShell>
  );
}

const styles = StyleSheet.create({
  stage: { height: 280, alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 3 },
  label: { alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.lg },
});
