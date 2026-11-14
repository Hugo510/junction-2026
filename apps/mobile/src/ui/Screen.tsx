import { createContext, useContext, useState, type ReactNode } from 'react';
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

const ScrollLockContext = createContext<(locked: boolean) => void>(() => undefined);

/** Lets a child pause the screen's scrolling while a finger is drawing on it (e.g. the body map). */
export const useScrollLock = () => useContext(ScrollLockContext);

/** Base layout: themed background, generous padding, optional sticky footer for the main action. */
export function Screen({ children, scroll = true, edges = ['bottom'], footer, contentStyle }: ScreenProps) {
  const { colors } = useTheme();
  const [locked, setLocked] = useState(false);
  const content = [styles.content, contentStyle];
  return (
    <SafeAreaView edges={edges} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollLockContext.Provider value={setLocked}>
        {scroll ? (
          <ScrollView contentContainerStyle={content} keyboardShouldPersistTaps="handled" scrollEnabled={!locked}>
            {children}
          </ScrollView>
        ) : (
          <View style={[content, styles.fill]}>{children}</View>
        )}
      </ScrollLockContext.Provider>
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
