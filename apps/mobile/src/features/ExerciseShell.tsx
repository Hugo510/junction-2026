import type { ReactNode } from 'react';
import { Stack } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { InterventionId } from '../domain/entities';
import { AppText, Screen, spacing } from '../ui';
import { FeedbackBar } from './FeedbackBar';

export interface ExerciseShellProps {
  id: InterventionId;
  hint?: string;
  children: ReactNode;
  /** Show "Did this help?" (usually after finishing). */
  showFeedback?: boolean;
  scroll?: boolean;
}

/** Common frame for comfort exercises: title, one-line hint, content, feedback. */
export function ExerciseShell({ id, hint, children, showFeedback = true, scroll = true }: ExerciseShellProps) {
  const { t } = useTranslation();
  return (
    <Screen scroll={scroll} footer={showFeedback ? <FeedbackBar id={id} /> : undefined}>
      <Stack.Screen options={{ title: t(`interventions.${id}.title`) }} />
      <View style={{ gap: spacing.xs }}>
        <AppText tone="muted">{t(`interventions.${id}.why`)}</AppText>
        {hint ? <AppText variant="caption" tone="muted">{hint}</AppText> : null}
      </View>
      {children}
    </Screen>
  );
}
