import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { haptics } from '../../services/haptics';
import { useChat } from '../../store/chat';
import { useData } from '../../store/data';
import { useReachOut } from '../../store/reachOut';
import { useSettings } from '../../store/settings';
import { AppText, Avatar, elevation, radii, spacing, useTheme } from '../../ui';

const AUTO_HIDE_MS = 9000;

/**
 * In-app banner that simulates "Hiillos reaches out first" (demo mode).
 * Discreet by default: the preview never mentions mood, depression or crisis, because family or
 * others may see the phone. The real words appear in the chat after tapping.
 */
export function ReachOutBanner() {
  const { t } = useTranslation();
  const { colors, reduceMotion } = useTheme();
  const insets = useSafeAreaInsets();
  const notice = useReachOut((s) => s.notice);
  const dismiss = useReachOut((s) => s.dismiss);
  const discreet = useSettings((s) => s.discreetNotifications);
  const patient = useData((s) => s.patient);

  useEffect(() => {
    if (!notice) return;
    haptics.soft();
    const id = setTimeout(dismiss, AUTO_HIDE_MS);
    return () => clearTimeout(id);
  }, [notice, dismiss]);

  if (!notice || !patient) return null;
  const text = discreet ? t('notify.discreet') : t(notice.textKey, { name: patient.companion.name, ...(notice.params ?? {}) });

  return (
    <Animated.View
      entering={reduceMotion ? undefined : FadeInUp.duration(260)}
      exiting={reduceMotion ? undefined : FadeOutUp.duration(200)}
      style={[styles.wrap, { top: insets.top + spacing.sm }]}
      pointerEvents="box-none"
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('common.appName')}. ${text}`}
        accessibilityHint={t('notify.openHint')}
        accessibilityLiveRegion="polite"
        onPress={() => {
          const kind = notice.kind;
          dismiss();
          router.navigate('/chat');
          // If today's conversation already started, add the companion's words to it.
          void useChat.getState().deliver(kind);
        }}
        style={[styles.banner, { backgroundColor: colors.surface }, elevation.high]}
      >
        <Avatar species={patient.companion.species} size={40} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="caption" tone="muted">
            {t('common.appName')} · {t('notify.now')}
          </AppText>
          <AppText variant="label">{text}</AppText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.sm, right: spacing.sm, zIndex: 100 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radii.lg },
});
