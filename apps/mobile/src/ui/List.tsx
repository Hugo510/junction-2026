import type { ReactNode } from 'react';
import { Children, Fragment } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { useTheme } from './theme';
import { elevation, MIN_TOUCH, radii, spacing } from './tokens';

/** Titled group of rows (iOS-settings style): one rounded surface, hairline separators, no nested cards. */
export function Section({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  const { colors, scheme } = useTheme();
  const items = Children.toArray(children).filter(Boolean);
  return (
    <View style={styles.section}>
      {title ? (
        <AppText variant="label" tone="muted" style={styles.sectionTitle}>
          {title}
        </AppText>
      ) : null}
      <View style={[styles.group, { backgroundColor: colors.surface }, scheme === 'dark' ? null : elevation.low]}>
        {items.map((child, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={[styles.separator, { backgroundColor: colors.border }]} /> : null}
            {child}
          </Fragment>
        ))}
      </View>
      {footer ? (
        <AppText variant="caption" tone="muted" style={styles.sectionTitle}>
          {footer}
        </AppText>
      ) : null}
    </View>
  );
}

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  /** Show a chevron for navigation rows. */
  chevron?: boolean;
  accessibilityHint?: string;
}

/** A row inside a Section. Pressable rows are ≥ 48 dp tall. */
export function ListItem({ title, subtitle, leading, trailing, onPress, chevron, accessibilityHint }: ListItemProps) {
  const { colors } = useTheme();
  const content = (
    <>
      {leading}
      <View style={styles.texts}>
        <AppText variant="label">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" tone="muted">
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailing}
      {chevron ? <Icon name="chevronRight" color={colors.textMuted} size={18} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfaceAlt }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  sectionTitle: { paddingHorizontal: spacing.xs },
  group: { borderRadius: radii.lg, overflow: 'hidden' },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH + 8, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  texts: { flex: 1, gap: 2 },
});
