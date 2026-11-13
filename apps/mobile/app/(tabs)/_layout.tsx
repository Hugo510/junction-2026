import { router, Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { HelpButton, Icon, useTheme, type IconName } from '../../src/ui';

function HeaderActions() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <HelpButton compact />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('a11y.settings')}
        onPress={() => router.push('/settings')}
        hitSlop={8}
        style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}
      >
        <Icon name="settings" color={colors.text} />
      </Pressable>
    </View>
  );
}

const TABS: { name: string; icon: IconName }[] = [
  { name: 'today', icon: 'today' },
  { name: 'checkin', icon: 'checkin' },
  { name: 'comfort', icon: 'comfort' },
  { name: 'insights', icon: 'insights' },
  { name: 'care', icon: 'care' },
];

export default function TabLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        headerRight: () => <HeaderActions />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: 64 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {TABS.map(({ name, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: t(`tabs.${name}`),
            tabBarAccessibilityLabel: t(`tabs.${name}`),
            tabBarIcon: ({ color }) => <Icon name={icon} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
