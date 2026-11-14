import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { currentLanguage } from '../../i18n';
import { speak, stopSpeaking } from '../../services/voice';
import { AppText, Icon, MIN_TOUCH, radii, spacing, useTheme } from '../../ui';

type State = 'idle' | 'loading' | 'playing' | 'error';

/** "Listen" under a companion message (only shown when the person turned the voice on). */
export function ListenButton({ text }: { text: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [state, setState] = useState<State>('idle');

  // Stop when the message leaves the screen.
  useEffect(() => () => stopSpeaking(), []);

  const press = async () => {
    if (state === 'playing' || state === 'loading') {
      stopSpeaking();
      setState('idle');
      return;
    }
    setState('loading');
    try {
      await speak(text, currentLanguage(), () => setState((s) => (s === 'error' ? s : 'idle')));
      setState('playing');
    } catch {
      setState('error');
    }
  };

  const label = t(state === 'loading' ? 'chat.listenLoading' : state === 'playing' ? 'chat.listenStop' : state === 'error' ? 'chat.listenError' : 'chat.listen');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: state === 'loading' }}
      onPress={press}
      hitSlop={6}
      style={({ pressed }) => [styles.button, { backgroundColor: pressed ? colors.surfaceAlt : 'transparent' }]}
    >
      {state === 'loading' ? <ActivityIndicator size="small" color={colors.textMuted} /> : <Icon name={state === 'playing' ? 'stop' : 'speaker'} color={colors.textMuted} size={18} />}
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    minHeight: MIN_TOUCH - 12,
    paddingHorizontal: spacing.sm,
    marginLeft: -spacing.sm,
    borderRadius: radii.pill,
  },
});
