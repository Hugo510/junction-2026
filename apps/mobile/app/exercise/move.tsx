import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { ExerciseShell } from '../../src/features/ExerciseShell';
import { companionService, useCompanionContext } from '../../src/services/companion';
import { haptics } from '../../src/services/haptics';
import { useMovement } from '../../src/services/sensors/movement';
import { useData } from '../../src/store/data';
import { useSettings } from '../../src/store/settings';
import { AppText, Avatar, Button, radii, spacing, useScreenFocused, useTheme } from '../../src/ui';

const SESSION_SECONDS = 120;
const BPM = 92;

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** 2-minute movement session: visual metronome + haptics, accelerometer-based encouragement. No audio. */
export default function MoveScreen() {
  const { t } = useTranslation();
  const { colors, reduceMotion } = useTheme();
  const ctx = useCompanionContext();
  const addSensorMinutes = useData((s) => s.addSensorMinutes);
  const movementAllowed = useSettings((s) => s.consents.movement);
  const focused = useScreenFocused();

  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [message, setMessage] = useState('');
  const [addedMinutes, setAddedMinutes] = useState(0);
  const activeSeconds = useRef(0);
  const beat = useSharedValue(1);
  const movement = useMovement(movementAllowed && state === 'running' && focused);
  const movingRef = useRef(false);
  movingRef.current = movement.isMoving;

  useEffect(() => {
    if (ctx) companionService.encourage('start', ctx).then(setMessage).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Metronome (paused while the screen is not visible)
  useEffect(() => {
    if (state !== 'running' || !focused) return;
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      if (!reduceMotion) beat.value = withSequence(withTiming(1.15, { duration: 90 }), withTiming(1, { duration: 260 }));
      if (n % 2 === 0) haptics.pulse();
    }, 60_000 / BPM);
    return () => clearInterval(id);
  }, [state, focused, reduceMotion, beat]);

  // Session clock + encouragement
  useEffect(() => {
    if (state !== 'running') return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 1;
        if (!movementAllowed || movingRef.current) activeSeconds.current += 1;
        if (ctx && next % 15 === 0) {
          const moment = movementAllowed && !movingRef.current ? 'gentle' : 'keepGoing';
          companionService.encourage(moment, ctx).then(setMessage).catch(() => undefined);
        }
        if (next >= SESSION_SECONDS) finish();
        return next;
      });
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const start = () => {
    activeSeconds.current = 0;
    setElapsed(0);
    setState('running');
  };

  const finish = () => {
    const minutes = Math.max(1, Math.round(activeSeconds.current / 60));
    setAddedMinutes(minutes);
    setState('done');
    haptics.confirm();
    void addSensorMinutes({ activityMinutes: minutes });
    if (ctx) companionService.encourage('done', ctx).then(setMessage).catch(() => undefined);
  };

  const beatStyle = useAnimatedStyle(() => ({ transform: [{ scale: beat.value }] }));

  return (
    <ExerciseShell id="move" hint={t('comfort.move.hint')} showFeedback={state === 'done'}>
      <View style={styles.row}>
        {ctx ? <Avatar species={ctx.companion.species} size={72} animated={state === 'running'} /> : null}
        <AppText style={{ flex: 1 }} accessibilityLiveRegion="polite">
          {message}
        </AppText>
      </View>

      <View style={styles.stage}>
        <Animated.View
          accessible
          accessibilityRole="image"
          accessibilityLabel={t('comfort.move.beat')}
          style={[styles.beat, { backgroundColor: colors.accentSoft, borderColor: colors.accent }, beatStyle]}
        >
          <AppText variant="title">{state === 'running' ? fmt(SESSION_SECONDS - elapsed) : fmt(SESSION_SECONDS)}</AppText>
        </Animated.View>
      </View>

      {movementAllowed ? (
        <View style={{ gap: spacing.xs }}>
          <AppText variant="label">{t('comfort.move.activity')}</AppText>
          <View
            style={[styles.meterTrack, { backgroundColor: colors.surfaceAlt }]}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={t('comfort.move.activity')}
            accessibilityValue={{ min: 0, max: 100, now: Math.round(movement.intensity * 100) }}
          >
            <View style={[styles.meterFill, { backgroundColor: colors.primary, width: `${Math.round(movement.intensity * 100)}%` }]} />
          </View>
        </View>
      ) : (
        <AppText variant="caption" tone="muted">
          {t('comfort.move.movementOff')}
        </AppText>
      )}

      {state === 'done' ? (
        <AppText variant="heading" tone="primary" accessibilityLiveRegion="polite">
          {t('comfort.move.finished', { minutes: addedMinutes })}
        </AppText>
      ) : null}

      {state === 'running' ? (
        <Button title={t('common.stop')} variant="secondary" onPress={finish} />
      ) : (
        <Button title={t('common.start')} onPress={start} />
      )}
    </ExerciseShell>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  stage: { alignItems: 'center', paddingVertical: spacing.md },
  beat: { width: 180, height: 180, borderRadius: 90, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  meterTrack: { height: 16, borderRadius: radii.pill, overflow: 'hidden' },
  meterFill: { height: 16, borderRadius: radii.pill },
});
