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

import { radii } from '../../ui';

/** Scene is drawn at 230 × 300 and scaled. */
const W = 230;
const H = 300;

const FLAMES = [
  { x: 70, w: 70, h: 120, color: '#F2A65A', delay: 0, dur: 1300 },
  { x: 110, w: 90, h: 160, color: '#F28C38', delay: 250, dur: 1600 },
  { x: 160, w: 70, h: 125, color: '#F2A65A', delay: 500, dur: 1400 },
  { x: 115, w: 50, h: 95, color: '#FFD27A', delay: 120, dur: 1100 },
];

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

function Flame({ x, w, h, color, delay, dur, active, size }: (typeof FLAMES)[number] & { active: boolean; size: number }) {
  const s = useFlicker(delay, dur, active);
  const fw = w * size;
  const fh = h * size;
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: (fh * (1 - s.value)) / 2 }, { scaleY: s.value }, { scaleX: 2 - s.value }],
    opacity: 0.75 + (s.value - 0.92) * 1.2,
  }));
  return (
    <Animated.View style={[{ position: 'absolute', left: x - fw / 2, bottom: 46, width: fw, height: fh }, style]}>
      <Svg width={fw} height={fh} viewBox="0 0 100 160">
        <Path d="M50 0 C 70 40 100 70 92 110 C 86 142 66 160 50 160 C 34 160 14 142 8 110 C 0 70 30 40 50 0 Z" fill={color} />
      </Svg>
    </Animated.View>
  );
}

function Spark({ i, active }: { i: number; active: boolean }) {
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
  return <Animated.View style={[styles.spark, { left: 80 + i * 22 }, style]} />;
}

export interface HearthProps {
  /** 0–1. Flame size and sparks follow it; flames never disappear (callers pass ≥ the ember floor). */
  intensity: number;
  /** Animate (pass false when hidden or when reduce motion is on). */
  active: boolean;
  /** Visual scale of the 230 × 300 scene. */
  scale?: number;
  accessibilityLabel?: string;
}

/** The hiillos: a fire whose glow reflects self-care. Shared by the chat home and the fireplace exercise. */
export function Hearth({ intensity, active, scale = 1, accessibilityLabel }: HearthProps) {
  const level = Math.max(0, Math.min(1, intensity));
  const flameSize = 0.45 + 0.55 * level;
  const sparks = Math.round(1 + 4 * level);
  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={{ width: W * scale, height: H * scale, borderRadius: radii.lg, overflow: 'hidden' }}
    >
      <View style={[styles.scene, { transform: [{ scale }], left: (W * scale - W) / 2, top: (H * scale - H) / 2 }]}>
        <Svg style={StyleSheet.absoluteFill} viewBox={`0 0 ${W} ${H}`}>
          <Defs>
            <LinearGradient id="hearthBg" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#2B2420" />
              <Stop offset="1" stopColor="#4A3426" />
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={H} fill="url(#hearthBg)" />
          <Ellipse cx={115} cy={250} rx={110} ry={44} fill="#F28C38" opacity={0.06 + 0.2 * level} />
        </Svg>
        {FLAMES.map((f, i) => (
          <Flame key={i} {...f} size={flameSize} active={active} />
        ))}
        {Array.from({ length: sparks }, (_, i) => (
          <Spark key={i} i={i} active={active} />
        ))}
        <Svg style={styles.logs} width={W} height={60} viewBox={`0 0 ${W} 60`}>
          <Rect x={30} y={14} width={170} height={22} rx={11} fill="#6B4A33" transform="rotate(-6 115 25)" />
          <Rect x={30} y={22} width={170} height={22} rx={11} fill="#7D5A3F" transform="rotate(6 115 33)" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { position: 'absolute', width: W, height: H },
  logs: { position: 'absolute', bottom: 8, left: 0 },
  spark: { position: 'absolute', bottom: 120, width: 5, height: 5, borderRadius: 3, backgroundColor: '#FFD27A' },
});
