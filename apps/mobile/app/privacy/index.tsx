import { router } from 'expo-router';
import { Alert, Share, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { repositories } from '../../src/data';
import { ConsentToggles } from '../../src/features/ConsentToggles';
import { useBackend } from '../../src/store/backend';
import { useChat } from '../../src/store/chat';
import { useData } from '../../src/store/data';
import { useSettings } from '../../src/store/settings';
import { AppText, Button, ListItem, Screen, Section, ToggleRow, spacing } from '../../src/ui';

const ITEMS = ['checkins', 'reaction', 'movement', 'location', 'trusted', 'where', 'sharing'] as const;

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const deleteEverything = useData((s) => s.deleteEverything);
  const resetSettings = useSettings((s) => s.reset);
  const discreet = useSettings((s) => s.discreetNotifications);
  const setDiscreet = useSettings((s) => s.setDiscreetNotifications);
  const ai = useSettings((s) => s.aiCompanion);
  const setAi = useSettings((s) => s.setAiCompanion);
  const voice = useSettings((s) => s.companionVoice);
  const setVoice = useSettings((s) => s.setCompanionVoice);
  const shared = useSettings((s) => s.sharedLearning);
  const setShared = useSettings((s) => s.setSharedLearning);
  const llmReady = useBackend((s) => s.llm);
  const voiceReady = useBackend((s) => s.voice);

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
      <Section title={t('privacy.whatTitle')}>
        {ITEMS.map((k) => (
          <ListItem key={k} title={t(`privacy.items.${k}`)} />
        ))}
      </Section>
      <Section title={t('privacy.sensorsTitle')}>
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <ConsentToggles />
        </View>
      </Section>
      <Section title={t('privacy.notificationsTitle')}>
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <ToggleRow label={t('privacy.discreet')} description={t('privacy.discreetDesc')} value={discreet} onChange={setDiscreet} />
        </View>
      </Section>
      {/* Both are opt-in and off by default. Without a server they stay off and the built-in companion answers. */}
      <Section title={t('privacy.ai.title')} footer={llmReady && voiceReady ? undefined : t('privacy.ai.unavailable')}>
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <ToggleRow label={t('privacy.ai.llm')} description={t('privacy.ai.llmDesc')} value={ai && llmReady} onChange={setAi} disabled={!llmReady} />
          <ToggleRow label={t('privacy.ai.voice')} description={t('privacy.ai.voiceDesc')} value={voice && voiceReady} onChange={setVoice} disabled={!voiceReady} />
        </View>
      </Section>
      <Section title={t('privacy.shared.title')}>
        <View style={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm }}>
          <ToggleRow label={t('privacy.shared.label')} description={t('privacy.shared.desc')} value={shared} onChange={setShared} />
        </View>
      </Section>

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
