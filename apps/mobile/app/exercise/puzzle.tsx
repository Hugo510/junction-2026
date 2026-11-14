import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { ExerciseShell } from '../../src/features/ExerciseShell';
import { haptics } from '../../src/services/haptics';
import { AppText, Button, radii, spacing, useTheme } from '../../src/ui';

const N = 3;
const SOLVED = [1, 2, 3, 4, 5, 6, 7, 8, 0];
const TILE_COLORS = ['#CFE3D4', '#C6DDCB', '#BDD7C3', '#D6D9EE', '#CCD0EA', '#C2C6E5', '#EFE6D6', '#E8DCC6'];

const neighbors = (i: number) => {
  const r = Math.floor(i / N);
  const c = i % N;
  const out: number[] = [];
  if (r > 0) out.push(i - N);
  if (r < N - 1) out.push(i + N);
  if (c > 0) out.push(i - 1);
  if (c < N - 1) out.push(i + 1);
  return out;
};

/** Shuffles with random valid moves so the puzzle is always solvable. */
function shuffled(): number[] {
  let tiles = [...SOLVED];
  let empty = 8;
  let prev = -1;
  for (let k = 0; k < 60; k++) {
    const options = neighbors(empty).filter((n) => n !== prev);
    const pick = options[Math.floor(Math.random() * options.length)];
    tiles = [...tiles];
    [tiles[empty], tiles[pick]] = [tiles[pick], tiles[empty]];
    prev = empty;
    empty = pick;
  }
  return tiles.join() === SOLVED.join() ? shuffled() : tiles;
}

export default function PuzzleScreen() {
  const { t } = useTranslation();
  const { colors, reduceMotion } = useTheme();
  const [tiles, setTiles] = useState<number[]>(shuffled);
  const [moves, setMoves] = useState(0);
  const [size, setSize] = useState(300);
  const solved = useMemo(() => tiles.join() === SOLVED.join(), [tiles]);
  const empty = tiles.indexOf(0);
  const cell = size / N;

  const move = (i: number) => {
    if (solved || !neighbors(empty).includes(i)) return;
    const next = [...tiles];
    [next[empty], next[i]] = [next[i], next[empty]];
    setTiles(next);
    setMoves((m) => m + 1);
    haptics.tap();
    if (next.join() === SOLVED.join()) haptics.confirm();
  };

  const onLayout = (e: LayoutChangeEvent) => setSize(e.nativeEvent.layout.width);

  return (
    <ExerciseShell id="puzzle" hint={t('comfort.puzzle.hint')} showFeedback={solved}>
      <View onLayout={onLayout} style={[styles.board, { height: size, backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        {tiles.map((value, i) => {
          if (value === 0) return null;
          const movable = neighbors(empty).includes(i) && !solved;
          return (
            <Animated.View
              key={value}
              layout={reduceMotion ? undefined : LinearTransition.duration(180)}
              style={[styles.tileWrap, { width: cell, height: cell, left: (i % N) * cell, top: Math.floor(i / N) * cell }]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={movable ? t('comfort.puzzle.tileMovable', { n: value }) : t('comfort.puzzle.tile', { n: value })}
                accessibilityState={{ disabled: !movable }}
                onPress={() => move(i)}
                style={[styles.tile, { backgroundColor: TILE_COLORS[value - 1], borderColor: movable ? colors.primary : 'transparent' }]}
              >
                <AppText variant="title" style={{ color: '#2B3A31' }}>
                  {value}
                </AppText>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
      <AppText tone="muted" align="center">
        {t('comfort.puzzle.moves', { count: moves })}
      </AppText>
      {solved ? (
        <AppText variant="heading" tone="primary" align="center" accessibilityLiveRegion="polite">
          {t('comfort.puzzle.solved')}
        </AppText>
      ) : null}
      <Button
        title={t('comfort.puzzle.shuffle')}
        variant="secondary"
        onPress={() => {
          setTiles(shuffled());
          setMoves(0);
        }}
      />
    </ExerciseShell>
  );
}

const styles = StyleSheet.create({
  board: { width: '100%', borderRadius: radii.lg, borderWidth: StyleSheet.hairlineWidth, position: 'relative', marginTop: spacing.sm },
  tileWrap: { position: 'absolute', padding: spacing.xs },
  tile: { flex: 1, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
});
