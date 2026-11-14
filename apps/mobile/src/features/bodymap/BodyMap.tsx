import { useMemo, useRef, useState, type ComponentRef } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

import { BODY_REGIONS, BODY_VIEWBOX, changedRegions, isEmptyBodyMap, paintRegion, regionAt } from '../../domain/bodyMap';
import type { BodyHeat, BodyMap } from '../../domain/entities';
import { haptics } from '../../services/haptics';
import { AppText, Chip, ChipGroup, spacing, useScrollLock, useTheme } from '../../ui';

const WARM = '#F28C38';
const COOL = '#7FA3CC';
type Brush = BodyHeat | 0;

/** Spoken / written summary of a map, e.g. "Warm: chest, head. Cool: left leg." */
export function useBodyMapSummary() {
  const { t } = useTranslation();
  return (map: BodyMap | undefined | null): string => {
    if (isEmptyBodyMap(map ?? undefined)) return t('bodyMap.empty');
    const names = (heat: BodyHeat) =>
      BODY_REGIONS.filter((s) => map?.[s.id] === heat)
        .map((s) => t(`bodyMap.regions.${s.id}`))
        .join(', ');
    return [names(1) && t('bodyMap.summaryWarm', { list: names(1) }), names(-1) && t('bodyMap.summaryCool', { list: names(-1) })]
      .filter(Boolean)
      .join(' ');
  };
}

/** The silhouette. Read-only when no onChange is given (journal rows, "your usual"). */
export function BodyMapView({
  value,
  onChange,
  brush = 1,
  width = 200,
}: {
  value: BodyMap;
  onChange?: (map: BodyMap) => void;
  brush?: Brush;
  width?: number;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const lockScroll = useScrollLock();
  const summary = useBodyMapSummary();
  const scale = width / BODY_VIEWBOX.width;
  const height = BODY_VIEWBOX.height * scale;
  const container = useRef<ComponentRef<typeof View>>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  // Latest values for the gesture handlers (they are created once).
  const latest = useRef({ value, brush, onChange });
  latest.current = { value, brush, onChange };

  const pan = useMemo(() => {
    const paintAt = (pageX: number, pageY: number) => {
      const o = origin.current;
      if (!o) return;
      const region = regionAt((pageX - o.x) / scale, (pageY - o.y) / scale);
      if (!region) return;
      const { value: current, brush: b, onChange: change } = latest.current;
      const next = paintRegion(current, region, b);
      if (next !== current) {
        haptics.tap();
        change?.(next);
      }
    };
    return PanResponder.create({
      // Taps go to the region buttons; a drag paints across regions.
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) + Math.abs(g.dy) > 6,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e, g) => {
        origin.current = null;
        // Where the finger went down (the drag is only recognised a few pixels later).
        const startX = e.nativeEvent.pageX - g.dx;
        const startY = e.nativeEvent.pageY - g.dy;
        container.current?.measureInWindow((x: number, y: number) => {
          origin.current = { x, y };
          paintAt(startX, startY);
        });
      },
      onPanResponderMove: (e) => paintAt(e.nativeEvent.pageX, e.nativeEvent.pageY),
    });
  }, [scale]);

  const fill = (heat: BodyHeat | undefined) => (heat === 1 ? WARM : heat === -1 ? COOL : colors.surfaceAlt);
  const svg = (
    <Svg width={width} height={height} viewBox={`0 0 ${BODY_VIEWBOX.width} ${BODY_VIEWBOX.height}`}>
      {BODY_REGIONS.map((s) => (
        <Rect key={s.id} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} fill={fill(value[s.id])} stroke={colors.border} strokeWidth={1.5} />
      ))}
    </Svg>
  );

  if (!onChange) {
    return (
      <View accessible accessibilityRole="image" accessibilityLabel={`${t('bodyMap.label')}. ${summary(value)}`} style={{ width, height }}>
        {svg}
      </View>
    );
  }

  return (
    <View
      ref={container}
      style={{ width, height }}
      onTouchStart={() => lockScroll(true)}
      onTouchEnd={() => lockScroll(false)}
      onTouchCancel={() => lockScroll(false)}
      {...pan.panHandlers}
    >
      {svg}
      {BODY_REGIONS.map((s) => {
        const heat = value[s.id];
        const state = t(heat === 1 ? 'bodyMap.state.warm' : heat === -1 ? 'bodyMap.state.cool' : 'bodyMap.state.neutral');
        return (
          <Pressable
            key={s.id}
            accessibilityRole="button"
            accessibilityLabel={`${t(`bodyMap.regions.${s.id}`)}: ${state}`}
            onPress={() => {
              haptics.tap();
              // Tapping with the same brush again clears the region.
              onChange(paintRegion(value, s.id, heat === brush ? 0 : brush));
            }}
            style={[styles.hit, { left: s.x * scale, top: s.y * scale, width: s.w * scale, height: s.h * scale }]}
          />
        );
      })}
    </View>
  );
}

/** Weekly check-in step: brush + silhouette + "your usual" for comparison. */
export function BodyMapEditor({ value, onChange, usual }: { value: BodyMap; onChange: (map: BodyMap) => void; usual: BodyMap | null }) {
  const { t } = useTranslation();
  const [brush, setBrush] = useState<Brush>(1);
  const summary = useBodyMapSummary();
  const changed = usual && !isEmptyBodyMap(value) ? changedRegions(value, usual) : [];

  return (
    <View style={styles.editor}>
      <ChipGroup>
        <Chip label={`🔥 ${t('bodyMap.brush.warm')}`} accessibilityLabel={t('bodyMap.brush.warm')} selected={brush === 1} onPress={() => setBrush(1)} />
        <Chip label={`❄️ ${t('bodyMap.brush.cool')}`} accessibilityLabel={t('bodyMap.brush.cool')} selected={brush === -1} onPress={() => setBrush(-1)} />
        <Chip label={t('bodyMap.brush.erase')} selected={brush === 0} onPress={() => setBrush(0)} />
      </ChipGroup>

      <View style={styles.row}>
        <BodyMapView value={value} onChange={onChange} brush={brush} width={190} />
        {usual ? (
          <View style={styles.usual}>
            <AppText variant="caption" tone="muted" align="center">
              {t('bodyMap.usual')}
            </AppText>
            <BodyMapView value={usual} width={76} />
          </View>
        ) : null}
      </View>

      <AppText variant="caption" tone="muted" accessibilityLiveRegion="polite">
        {summary(value)}
      </AppText>
      {usual && changed.length > 0 ? (
        <AppText variant="caption" tone="primary">
          {t('bodyMap.different', { list: changed.map((id) => t(`bodyMap.regions.${id}`)).join(', ') })}
        </AppText>
      ) : null}
      <AppText variant="caption" tone="muted">
        {t('bodyMap.selfReport')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: { position: 'absolute' },
  editor: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: spacing.lg },
  usual: { alignItems: 'center', gap: spacing.xs },
});
