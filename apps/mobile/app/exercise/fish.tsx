import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Animated, { useAnimatedStyle, useFrameCallback, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { ExerciseShell } from '../../src/features/ExerciseShell';
import { subscribeAccelerometer } from '../../src/services/sensors/movement';
import { useSettings } from '../../src/store/settings';
import { AppText, radii, useTheme } from '../../src/ui';

interface Fish {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
}

const COLORS = ['#F2A65A', '#E8C07A', '#D98F8F', '#9FC5A8', '#B9BCF0', '#F2C1A0'];
const SIZES = [46, 38, 52, 34, 42, 36];
const MAX_SPEED = 38; // px per second: slow and calm
const LAKE_HEIGHT = 360;

const initialFish = (w: number, h: number): Fish[] =>
  COLORS.map((_, i) => ({
    x: ((i + 0.5) / COLORS.length) * w,
    y: (((i * 37) % 100) / 100) * (h - 60) + 30,
    vx: i % 2 === 0 ? 18 : -18,
    vy: 0,
    phase: i * 1.3,
  }));

function FishView({ index, fish }: { index: number; fish: { value: Fish[] } }) {
  const size = SIZES[index];
  const style = useAnimatedStyle(() => {
    const f = fish.value[index];
    if (!f) return { opacity: 0 };
    return {
      opacity: 1,
      transform: [{ translateX: f.x - size / 2 }, { translateY: f.y - size / 4 }, { scaleX: f.vx >= 0 ? 1 : -1 }],
    };
  });
  return (
    <Animated.View style={[styles.fish, { width: size, height: size / 2 }, style]} pointerEvents="none">
      <Svg width={size} height={size / 2} viewBox="0 0 100 50">
        <Path d="M 0 25 L 22 8 L 22 42 Z" fill={COLORS[index]} opacity={0.9} />
        <Ellipse cx={58} cy={25} rx={38} ry={18} fill={COLORS[index]} />
        <Circle cx={80} cy={21} r={3.5} fill="#2B2B2B" />
      </Svg>
    </Animated.View>
  );
}

export default function FishScreen() {
  const { t } = useTranslation();
  const { colors, reduceMotion } = useTheme();
  const tiltAllowed = useSettings((s) => s.consents.movement);

  const width = useSharedValue(300);
  const height = useSharedValue(LAKE_HEIGHT);
  const fish = useSharedValue<Fish[]>(initialFish(300, LAKE_HEIGHT));
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const ripple = useSharedValue({ x: -999, y: -999, age: 99 });
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);

  useEffect(() => {
    if (!tiltAllowed) return;
    return subscribeAccelerometer(({ x, y }) => {
      tiltX.value = x;
      tiltY.value = y;
    }, 100);
  }, [tiltAllowed, tiltX, tiltY]);

  useFrameCallback((frame) => {
    'worklet';
    const dt = Math.min(0.05, (frame.timeSincePreviousFrame ?? 16) / 1000);
    const w = width.value;
    const h = height.value;
    const r = ripple.value;
    ripple.value = { x: r.x, y: r.y, age: r.age + dt };
    fish.value = fish.value.map((f) => {
      let vx = f.vx + tiltX.value * 30 * dt;
      let vy = f.vy - tiltY.value * 30 * dt + Math.sin(f.phase) * 6 * dt;
      // gentle push away from a recent ripple
      if (r.age < 1.2) {
        const dx = f.x - r.x;
        const dy = f.y - r.y;
        const d = Math.max(20, Math.sqrt(dx * dx + dy * dy));
        if (d < 140) {
          vx += (dx / d) * 60 * dt * (1.2 - r.age);
          vy += (dy / d) * 60 * dt * (1.2 - r.age);
        }
      }
      vy *= 0.98;
      const speed = Math.sqrt(vx * vx + vy * vy);
      if (speed > MAX_SPEED) {
        vx = (vx / speed) * MAX_SPEED;
        vy = (vy / speed) * MAX_SPEED;
      }
      if (Math.abs(vx) < 8) vx = vx >= 0 ? 8 : -8;
      let x = f.x + vx * dt;
      let y = f.y + vy * dt;
      if (x < -30) x = w + 30;
      if (x > w + 30) x = -30;
      if (y < 20) {
        y = 20;
        vy = Math.abs(vy);
      }
      if (y > h - 20) {
        y = h - 20;
        vy = -Math.abs(vy);
      }
      return { x, y, vx, vy, phase: f.phase + dt };
    });
  }, !reduceMotion);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    width.value = w;
    height.value = h;
    fish.value = initialFish(w, h);
  };

  const onTap = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    ripple.value = { x: locationX, y: locationY, age: 0 };
    rippleScale.value = 0;
    rippleOpacity.value = 0.8;
    rippleScale.value = withTiming(1, { duration: reduceMotion ? 0 : 1200 });
    rippleOpacity.value = withTiming(0, { duration: reduceMotion ? 300 : 1200 });
  };

  const rippleStyle = useAnimatedStyle(() => ({
    opacity: rippleOpacity.value,
    transform: [{ translateX: ripple.value.x - 60 }, { translateY: ripple.value.y - 60 }, { scale: 0.2 + rippleScale.value }],
  }));

  return (
    <ExerciseShell id="fish" hint={t('comfort.fish.hint')} scroll={false}>
      <Pressable
        accessibilityRole="image"
        accessibilityLabel={t('comfort.fish.a11y')}
        onPress={onTap}
        onLayout={onLayout}
        style={styles.lake}
      >
        <LinearGradient colors={[colors.lakeTop, colors.lakeBottom]} style={StyleSheet.absoluteFill} />
        <Animated.View pointerEvents="none" style={[styles.ripple, rippleStyle]} />
        {COLORS.map((_, i) => (
          <FishView key={i} index={i} fish={fish} />
        ))}
      </Pressable>
      {!tiltAllowed ? (
        <View>
          <AppText variant="caption" tone="muted">
            {t('comfort.fish.tiltOff')}
          </AppText>
        </View>
      ) : null}
    </ExerciseShell>
  );
}

const styles = StyleSheet.create({
  lake: { height: LAKE_HEIGHT, borderRadius: radii.lg, overflow: 'hidden' },
  fish: { position: 'absolute', left: 0, top: 0 },
  ripple: { position: 'absolute', left: 0, top: 0, width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#FFFFFF' },
});
