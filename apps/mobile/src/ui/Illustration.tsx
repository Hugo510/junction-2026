import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';

import { useTheme } from './theme';
import type { Category } from './tokens';

export type IllustrationName =
  | 'ember'
  | 'breath'
  | 'fireplace'
  | 'lake'
  | 'waves'
  | 'puzzle'
  | 'move'
  | 'walk'
  | 'journal'
  | 'trends'
  | 'care'
  | 'checkin'
  | 'plan'
  | 'privacy'
  | 'clinic';

/**
 * Original, abstract illustrations for hub cards: a few soft shapes in the colours of the card's area.
 * Purely decorative (hidden from screen readers); the card's text carries the meaning.
 */
export function Illustration({ name, category, size = 96 }: { name: IllustrationName; category: Category; size?: number }) {
  const { colors } = useTheme();
  const { art: a, artSoft: s } = colors.categories[category];

  const shapes = {
    // Three coals with a soft glow.
    ember: (
      <>
        <Circle cx={50} cy={46} r={34} fill={s} opacity={0.55} />
        <Path d="M50 20c10 12 18 20 18 32a18 18 0 0 1-36 0c0-8 5-13 9-19 2 5 4 7 6 8 0-8 1-14 3-21z" fill={a} />
        <Ellipse cx={30} cy={80} rx={14} ry={9} fill={a} opacity={0.75} />
        <Ellipse cx={52} cy={84} rx={16} ry={9} fill={a} />
        <Ellipse cx={74} cy={80} rx={13} ry={8} fill={a} opacity={0.75} />
      </>
    ),
    // Rings breathing out.
    breath: (
      <>
        <Circle cx={50} cy={50} r={42} fill={s} opacity={0.4} />
        <Circle cx={50} cy={50} r={30} fill={s} opacity={0.75} />
        <Circle cx={50} cy={50} r={17} fill={a} />
      </>
    ),
    // A hearth: arch, logs and a flame.
    fireplace: (
      <>
        <Path d="M14 90V46a36 36 0 0 1 72 0v44z" fill={s} opacity={0.7} />
        <Path d="M50 34c8 10 14 16 14 26a14 14 0 0 1-28 0c0-6 4-10 7-15 1 4 3 6 5 7 0-7 0-12 2-18z" fill={a} />
        <Rect x={28} y={76} width={44} height={9} rx={4.5} fill={a} opacity={0.8} />
        <Rect x={34} y={68} width={32} height={8} rx={4} fill={a} opacity={0.55} />
      </>
    ),
    // Calm water with a small fish.
    lake: (
      <>
        <Circle cx={72} cy={26} r={13} fill={s} />
        <Path d="M4 56c12-9 22-9 34 0s22 9 34 0 16-7 24-3v43H4z" fill={s} opacity={0.8} />
        <Path d="M4 72c12-8 22-8 34 0s22 8 34 0 16-6 24-3v27H4z" fill={a} />
        <Path d="M30 46c7-7 17-7 24 0-7 7-17 7-24 0zm24 0l8-6v12z" fill={a} />
      </>
    ),
    // Three rolling waves under a low moon.
    waves: (
      <>
        <Circle cx={74} cy={24} r={12} fill={s} />
        <Path d="M0 46c10-10 20-10 30 0s20 10 30 0 20-10 40 2v52H0z" fill={s} opacity={0.6} />
        <Path d="M0 62c12-10 22-10 34 0s22 10 34 0 18-8 32 0v38H0z" fill={a} opacity={0.7} />
        <Path d="M0 78c12-9 24-9 36 0s24 9 36 0 16-7 28-2v24H0z" fill={a} />
      </>
    ),
    // Four rounded tiles, one out of place.
    puzzle: (
      <>
        <Rect x={14} y={14} width={33} height={33} rx={9} fill={a} />
        <Rect x={53} y={14} width={33} height={33} rx={9} fill={s} />
        <Rect x={14} y={53} width={33} height={33} rx={9} fill={s} />
        <Rect x={57} y={57} width={33} height={33} rx={9} fill={a} opacity={0.8} transform="rotate(12 73 73)" />
      </>
    ),
    // A ball bouncing along an arc.
    move: (
      <>
        <Path d="M10 84c10-44 28-60 42-60s28 16 38 60" fill="none" stroke={s} strokeWidth={8} strokeLinecap="round" strokeDasharray="2 16" />
        <Circle cx={52} cy={32} r={17} fill={a} />
        <Ellipse cx={52} cy={88} rx={26} ry={5} fill={s} opacity={0.7} />
      </>
    ),
    // Hills, a path and a low sun.
    walk: (
      <>
        <Circle cx={70} cy={30} r={15} fill={s} />
        <Path d="M0 72c16-22 34-22 52-6s32 10 48-8v38H0z" fill={s} opacity={0.75} />
        <Path d="M0 84c20-16 40-14 56-4s30 6 44-6v22H0z" fill={a} />
        <Path d="M44 96c2-8 8-12 6-20" fill="none" stroke={colors.categories[category].bg} strokeWidth={5} strokeLinecap="round" />
      </>
    ),
    // An open notebook with a bookmark.
    journal: (
      <>
        <Rect x={16} y={18} width={68} height={66} rx={12} fill={s} />
        <Rect x={16} y={18} width={34} height={66} rx={12} fill={a} />
        <Rect x={58} y={34} width={18} height={5} rx={2.5} fill={a} opacity={0.7} />
        <Rect x={58} y={46} width={18} height={5} rx={2.5} fill={a} opacity={0.7} />
        <Rect x={58} y={58} width={12} height={5} rx={2.5} fill={a} opacity={0.7} />
        <Path d="M26 18h12v26l-6-6-6 6z" fill={s} />
      </>
    ),
    // Soft bars rising with a dot on top.
    trends: (
      <>
        <Rect x={14} y={58} width={16} height={28} rx={8} fill={s} />
        <Rect x={36} y={44} width={16} height={42} rx={8} fill={a} opacity={0.75} />
        <Rect x={58} y={30} width={16} height={56} rx={8} fill={a} />
        <Circle cx={84} cy={22} r={9} fill={s} />
      </>
    ),
    // Two figures side by side.
    care: (
      <>
        <Circle cx={36} cy={32} r={14} fill={a} />
        <Path d="M12 88a24 24 0 0 1 48 0z" fill={a} />
        <Circle cx={68} cy={40} r={12} fill={s} />
        <Path d="M48 88a20 20 0 0 1 40 0z" fill={s} />
      </>
    ),
    // A speech bubble with a small ember inside.
    checkin: (
      <>
        <Path d="M16 20h68a10 10 0 0 1 10 10v36a10 10 0 0 1-10 10H46L28 90V76H16A10 10 0 0 1 6 66V30a10 10 0 0 1 10-10z" fill={s} />
        <Circle cx={32} cy={48} r={7} fill={a} opacity={0.6} />
        <Circle cx={50} cy={48} r={7} fill={a} opacity={0.8} />
        <Circle cx={68} cy={48} r={7} fill={a} />
      </>
    ),
    // A short list with one item done.
    plan: (
      <>
        <Rect x={14} y={14} width={72} height={72} rx={16} fill={s} opacity={0.7} />
        <Circle cx={32} cy={36} r={8} fill={a} />
        <Rect x={46} y={32} width={30} height={8} rx={4} fill={a} opacity={0.7} />
        <Circle cx={32} cy={62} r={8} fill="none" stroke={a} strokeWidth={4} />
        <Rect x={46} y={58} width={22} height={8} rx={4} fill={a} opacity={0.45} />
        <Path d="M28 36l3 3 6-6" fill="none" stroke={colors.categories[category].bg} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
    // A shield with a keyhole.
    privacy: (
      <>
        <Path d="M50 10l34 12v26c0 20-14 34-34 42-20-8-34-22-34-42V22z" fill={s} />
        <Circle cx={50} cy={44} r={10} fill={a} />
        <Rect x={45} y={48} width={10} height={20} rx={5} fill={a} />
      </>
    ),
    // A clipboard with rows ordered by need.
    clinic: (
      <>
        <Rect x={18} y={16} width={64} height={74} rx={12} fill={s} />
        <Rect x={36} y={10} width={28} height={14} rx={7} fill={a} />
        <Rect x={28} y={36} width={44} height={9} rx={4.5} fill={a} />
        <Rect x={28} y={52} width={32} height={9} rx={4.5} fill={a} opacity={0.7} />
        <Rect x={28} y={68} width={20} height={9} rx={4.5} fill={a} opacity={0.45} />
      </>
    ),
  } satisfies Record<IllustrationName, ReactNode>;

  return (
    <View aria-hidden style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        {shapes[name]}
      </Svg>
    </View>
  );
}
