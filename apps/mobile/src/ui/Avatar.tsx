import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg';

import type { CompanionSpecies } from '../domain/entities';
import { useTheme } from './theme';

export interface AvatarProps {
  species: CompanionSpecies;
  size?: number;
  /** Gentle breathing + blinking. Automatically static when reduce motion is on. */
  animated?: boolean;
  accessibilityLabel?: string;
}

const INK = '#2B2B2B';
const CHEEK = '#F2A7A0';

function Eyes({ y, dx = 10, blink }: { y: number; dx?: number; blink: boolean }) {
  const ry = blink ? 0.7 : 3.6;
  return (
    <G>
      <Ellipse cx={50 - dx} cy={y} rx={3.2} ry={ry} fill={INK} />
      <Ellipse cx={50 + dx} cy={y} rx={3.2} ry={ry} fill={INK} />
      <Circle cx={50 - dx - 9} cy={y + 9} r={4} fill={CHEEK} opacity={0.55} />
      <Circle cx={50 + dx + 9} cy={y + 9} r={4} fill={CHEEK} opacity={0.55} />
    </G>
  );
}

const smile = (y: number) => <Path d={`M 43 ${y} Q 50 ${y + 6} 57 ${y}`} stroke={INK} strokeWidth={2.4} fill="none" strokeLinecap="round" />;

/** Original, simple companion designs (shapes only). */
function Figure({ species, blink }: { species: CompanionSpecies; blink: boolean }) {
  switch (species) {
    case 'bee':
      return (
        <G>
          <Ellipse cx={30} cy={32} rx={13} ry={9} fill="#DCEBF6" opacity={0.95} />
          <Ellipse cx={70} cy={32} rx={13} ry={9} fill="#DCEBF6" opacity={0.95} />
          <Line x1={42} y1={32} x2={36} y2={16} stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
          <Line x1={58} y1={32} x2={64} y2={16} stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
          <Circle cx={36} cy={15} r={3} fill={INK} />
          <Circle cx={64} cy={15} r={3} fill={INK} />
          <Circle cx={50} cy={58} r={31} fill="#F4C95D" />
          <Path d="M 23 72 Q 50 84 77 72" stroke="#5A4630" strokeWidth={6} fill="none" strokeLinecap="round" />
          <Path d="M 31 84 Q 50 93 69 84" stroke="#5A4630" strokeWidth={5} fill="none" strokeLinecap="round" />
          <Eyes y={52} blink={blink} />
          {smile(61)}
        </G>
      );
    case 'cat':
      return (
        <G>
          <Path d="M 22 44 L 25 12 L 47 30 Z" fill="#C9B8A6" />
          <Path d="M 78 44 L 75 12 L 53 30 Z" fill="#C9B8A6" />
          <Path d="M 27 36 L 28 20 L 39 30 Z" fill="#EBC6C2" />
          <Path d="M 73 36 L 72 20 L 61 30 Z" fill="#EBC6C2" />
          <Circle cx={50} cy={56} r={32} fill="#C9B8A6" />
          <Eyes y={50} blink={blink} dx={11} />
          <Path d="M 47 60 L 53 60 L 50 64 Z" fill="#B5838D" />
          <Path d="M 50 64 Q 46 69 42 66 M 50 64 Q 54 69 58 66" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
          <Path d="M 22 58 L 36 60 M 22 66 L 36 64 M 78 58 L 64 60 M 78 66 L 64 64" stroke="#7D6E62" strokeWidth={1.5} strokeLinecap="round" />
        </G>
      );
    case 'dog':
      return (
        <G>
          <Ellipse cx={22} cy={52} rx={10} ry={20} fill="#A9805A" />
          <Ellipse cx={78} cy={52} rx={10} ry={20} fill="#A9805A" />
          <Circle cx={50} cy={55} r={30} fill="#E3C9A0" />
          <Ellipse cx={50} cy={68} rx={14} ry={11} fill="#F5E8D2" />
          <Ellipse cx={50} cy={62} rx={5.5} ry={4} fill={INK} />
          <Eyes y={48} blink={blink} dx={11} />
          <Path d="M 44 70 Q 50 75 56 70" stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        </G>
      );
    case 'bird':
      return (
        <G>
          <Path d="M 46 26 Q 50 12 55 25" stroke="#7FA3CC" strokeWidth={4} fill="none" strokeLinecap="round" />
          <Circle cx={50} cy={56} r={31} fill="#A9C7E8" />
          <Ellipse cx={50} cy={70} rx={19} ry={14} fill="#EEF4FB" />
          <Ellipse cx={22} cy={62} rx={8} ry={14} fill="#8FB3DA" />
          <Ellipse cx={78} cy={62} rx={8} ry={14} fill="#8FB3DA" />
          <Eyes y={48} blink={blink} dx={11} />
          <Path d="M 45 56 L 55 56 L 50 63 Z" fill="#F2A65A" />
        </G>
      );
    case 'person':
    default:
      return (
        <G>
          <Path d="M 18 100 Q 18 74 50 74 Q 82 74 82 100 Z" fill="#B9BCF0" />
          <Circle cx={50} cy={46} r={23} fill="#D6E4DA" />
          <Path d="M 27 44 Q 28 20 50 21 Q 72 20 73 44 Q 63 31 50 32 Q 37 31 27 44 Z" fill="#6B7F73" />
          <Eyes y={47} blink={blink} dx={9} />
          {smile(56)}
        </G>
      );
  }
}

export function Avatar({ species, size = 96, animated = false, accessibilityLabel }: AvatarProps) {
  const { colors, reduceMotion } = useTheme();
  const moving = animated && !reduceMotion;
  const scale = useSharedValue(1);
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    if (!moving) {
      cancelAnimation(scale);
      scale.value = 1;
      return;
    }
    scale.value = withRepeat(withTiming(1.04, { duration: 2400 }), -1, true);
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 4200);
    return () => {
      clearInterval(id);
      cancelAnimation(scale);
    };
  }, [moving, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft, overflow: 'hidden' }}
    >
      <Animated.View style={[{ width: size, height: size }, style]}>
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Figure species={species} blink={blink} />
        </Svg>
      </Animated.View>
    </View>
  );
}
