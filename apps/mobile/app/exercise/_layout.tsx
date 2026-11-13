import { Stack } from 'expo-router';

import { HelpButton, useTheme } from '../../src/ui';

export default function ExerciseLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        headerRight: () => <HelpButton compact />,
      }}
    />
  );
}
