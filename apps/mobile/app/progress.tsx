import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { InsightsView } from '../src/features/insights/InsightsView';
import { JournalView } from '../src/features/journal/JournalView';
import { haptics } from '../src/services/haptics';
import { AppText, Button, MIN_TOUCH, radii, Screen, spacing, useTheme } from '../src/ui';

type Tab = 'journal' | 'trends';

/** One place for "how am I doing": the emotional journal and the 14-day trends. */
export default function ProgressScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'trends' ? 'trends' : 'journal');

  return (
    <Screen footer={tab === 'journal' ? <Button title={t('journal.add')} onPress={() => router.push('/journal/new')} /> : undefined}>
      <View style={[styles.segmented, { backgroundColor: colors.surfaceAlt }]} accessibilityRole="tablist">
        {(['journal', 'trends'] as Tab[]).map((key) => {
          const selected = tab === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => {
                haptics.tap();
                setTab(key);
              }}
              style={[styles.segment, selected && { backgroundColor: colors.surface }]}
            >
              <AppText variant="label" tone={selected ? 'default' : 'muted'}>
                {t(`progress.tabs.${key}`)}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {tab === 'journal' ? <JournalView /> : <InsightsView />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmented: { flexDirection: 'row', borderRadius: radii.pill, padding: spacing.xs, gap: spacing.xs },
  segment: { flex: 1, minHeight: MIN_TOUCH, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
});
