import { router } from 'expo-router';
import { Alert, Share, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { repositories } from '../../src/data';
import { ConsentToggles } from '../../src/features/ConsentToggles';
import { useChat } from '../../src/store/chat';
import { useData } from '../../src/store/data';
import { useSettings } from '../../src/store/settings';
import { AppText, Button, Card, Screen, spacing } from '../../src/ui';

const ITEMS = ['checkins', 'reaction', 'movement', 'location', 'where', 'sharing'] as const;

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const deleteEverything = useData((s) => s.deleteEverything);
  const resetSettings = useSettings((s) => s.reset);

  const exportData = async () => {
    const data = await repositories.admin.exportAll();
    const settings = useSettings.getState();
    const payload = {
      exportedAt: new Date().toISOString(),
      settings: {
        language: settings.language,
        themeMode: settings.themeMode,
        largeText: settings.largeText,
        reduceMotion: settings.reduceMotion,
        consents: settings.consents,
      },
      data,
    };
    await Share.share({ title: t('privacy.export'), message: JSON.stringify(payload, null, 2) }).catch(() => undefined);
  };

  const confirmDelete = () => {
    Alert.alert(t('privacy.deleteTitle'), t('privacy.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('privacy.deleteConfirm'),
        style: 'destructive',
        onPress: async () => {
          await deleteEverything();
          await useChat.getState().reset();
          resetSettings();
          await useSettings.persist.clearStorage();
          if (router.canDismiss()) router.dismissAll();
          router.replace('/start');
        },
      },
    ]);
  };

  return (
    <Screen>
      <AppText>{t('privacy.intro')}</AppText>
      <Card>
        <AppText variant="heading">{t('privacy.whatTitle')}</AppText>
        {ITEMS.map((k) => (
          <AppText key={k}>• {t(`privacy.items.${k}`)}</AppText>
        ))}
      </Card>
      <Card>
        <AppText variant="heading">{t('privacy.sensorsTitle')}</AppText>
        <ConsentToggles />
      </Card>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="caption" tone="muted">
          {t('privacy.exportBody')}
        </AppText>
        <Button title={t('privacy.export')} variant="secondary" onPress={exportData} />
        <Button title={t('privacy.delete')} variant="danger" onPress={confirmDelete} />
      </View>
    </Screen>
  );
}
