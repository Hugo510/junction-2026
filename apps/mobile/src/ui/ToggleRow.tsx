import { StyleSheet, Switch, View } from 'react-native';

import { haptics } from '../services/haptics';
import { AppText } from './AppText';
import { useTheme } from './theme';
import { MIN_TOUCH, spacing } from './tokens';

export interface ToggleRowProps {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}

export function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <AppText variant="label">{label}</AppText>
        {description ? (
          <AppText variant="caption" tone="muted">
            {description}
          </AppText>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        accessibilityHint={description}
        value={value}
        onValueChange={(v) => {
          haptics.tap();
          onChange(v);
        }}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: MIN_TOUCH, paddingVertical: spacing.xs },
  text: { flex: 1, gap: 2 },
});
