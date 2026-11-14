import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { ExerciseShell } from '../../src/features/ExerciseShell';
import { radii, useScreenFocused, useTheme } from '../../src/ui';

const FLAMES = [
  { x: 70, w: 70, h: 120, color: '#F2A65A', delay: 0, dur: 1300 },
  { x: 110, w: 90, h: 160, color: '#F28C38', delay: 250, dur: 1600 },
  { x: 160, w: 70, h: 125, color: '#F2A65A', delay: 500, dur: 1400 },
  { x: 115, w: 50, h: 95, color: '#FFD27A', delay: 120, dur: 1100 },
];

const EMBERS = [0, 1, 2, 3, 4];

function useFlicker(delay: number, duration: number, active: boolean): SharedValue<number> {
  const v = useSharedValue(1);
  useEffect(() => {
    if (!active) {
      cancelAnimation(v);
      v.value = 1;
      return;
    }
    v.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.12, { duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.92, { duration: duration * 0.8, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(v);
  }, [active, delay, duration, v]);
  return v;
}

function Flame({ x, w, h, color, delay, dur, active }: (typeof FLAMES)[number] & { active: boolean }) {
  const s = useFlicker(delay, dur, active);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: (h * (1 - s.value)) / 2 }, { scaleY: s.value }, { scaleX: 2 - s.value }],
    opacity: 0.75 + (s.value - 0.92) * 1.2,
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x - w / 2, bottom: 46, width: w, height: h }, style]}>
      <Svg width={w} height={h} viewBox="0 0 100 160">
        <Path d="M50 0 C 70 40 100 70 92 110 C 86 142 66 160 50 160 C 34 160 14 142 8 110 C 0 70 30 40 50 0 Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

function Ember({ i, active }: { i: number; active: boolean }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (!active) {
      cancelAnimation(y);
      y.value = 0;
      return;
    }
    y.value = withDelay(i * 700, withRepeat(withTiming(1, { duration: 3200 + i * 300, easing: Easing.out(Easing.quad) }), -1, false));
    return () => cancelAnimation(y);
  }, [active, i, y]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -y.value * 170 }, { translateX: Math.sin(y.value * 6 + i) * 10 }],
    opacity: active ? 1 - y.value : 0,
  }));
  return <Animated.View style={[styles.ember, { left: 80 + i * 22 }, style]} />;
}

/** Calming fireplace scene. Static when reduce motion is on. */
export default function FireplaceScreen() {
  const { t } = useTranslation();
  const { reduceMotion } = useTheme();
  const focused = useScreenFocused();
  // Pause when the screen is not visible (battery + smoothness).
  const active = !reduceMotion && focused;
  return (
    <ExerciseShell id="fireplace" hint={t('comfort.fireplace.hint')}>
      <View style={styles.scene} accessible accessibilityRole="image" accessibilityLabel={t('interventions.fireplace.title')}>
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 230 280" preserveAspectRatio="xMidYMid slice">
          <Defs>
            <LinearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#2B2420" />
              <Stop offset="1" stopColor="#4A3426" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={230} height={280} fill="url(#bg)" />
          <Ellipse cx={115} cy={230} rx={110} ry={40} fill="#F28C38" opacity={0.12} />
        </Svg>
        {FLAMES.map((f, i) => (
          <Flame key={i} {...f} active={active} />
        ))}
        {EMBERS.map((i) => (
          <Ember key={i} i={i} active={active} />
        ))}
        <Svg style={styles.logs} width={230} height={60} viewBox="0 0 230 60">
          <Rect x={30} y={14} width={170} height={22} rx={11} fill="#6B4A33" transform="rotate(-6 115 25)" />
          <Rect x={30} y={22} width={170} height={22} rx={11} fill="#7D5A3F" transform="rotate(6 115 33)" />
        </Svg>
      </View>
    </ExerciseShell>
  );
}

const styles = StyleSheet.create({
  scene: { height: 300, borderRadius: radii.lg, overflow: 'hidden', alignSelf: 'center', width: 230 },
  logs: { position: 'absolute', bottom: 8, left: 0 },
  ember: { position: 'absolute', bottom: 120, width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFD27A' },
});
