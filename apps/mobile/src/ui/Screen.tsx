import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from './theme';
import { spacing } from './tokens';

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  /** Safe-area edges. Screens under a header usually only need the bottom edge. */
  edges?: Edge[];
  footer?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Base layout: themed background, generous padding, optional sticky footer for the main action. */
export function Screen({ children, scroll = true, edges = ['bottom'], footer, contentStyle }: ScreenProps) {
  const { colors } = useTheme();
  const content = [styles.content, contentStyle];
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[content, styles.fill]}>{children}</View>
      )}
      {footer ? <View style={[styles.footer, { borderTopColor: colors.border }]}>{footer}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.sm },
});
