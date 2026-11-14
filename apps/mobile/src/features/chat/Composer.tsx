import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import type { QuickReplyId } from '../../domain/chat/types';
import { haptics } from '../../services/haptics';
import { AppText, Chip, Icon, MIN_TOUCH, radii, spacing, useTheme } from '../../ui';

/** Suggestion chips, like ChatGPT's suggested prompts. */
export function QuickReplies({ ids, onPick }: { ids: QuickReplyId[]; onPick: (id: QuickReplyId) => void }) {
  const { t } = useTranslation();
  if (!ids.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.quickScroll}
      contentContainerStyle={styles.quick}
      keyboardShouldPersistTaps="handled"
    >
      {ids.map((id) => (
        <Chip key={id} role="button" label={t(`chat.quick.${id}`)} onPress={() => onPick(id)} />
      ))}
    </ScrollView>
  );
}

export function Composer({
  name,
  disabled,
  onSend,
  onPlus,
}: {
  name: string;
  disabled: boolean;
  onSend: (text: string) => void;
  /** Opens the quick-actions sheet (like ChatGPT's attachments button). */
  onPlus: () => void;
}) {
  const { t } = useTranslation();
  const { colors, textScale, font } = useTheme();
  const [text, setText] = useState('');
  const canSend = text.trim().length > 0 && !disabled;

  const send = () => {
    if (!canSend) return;
    haptics.tap();
    onSend(text);
    setText('');
  };

  return (
    <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('chat.actions.open')}
        onPress={onPlus}
        hitSlop={6}
        style={[styles.send, { backgroundColor: colors.surfaceAlt }]}
      >
        <Icon name="plus" color={colors.text} size={20} />
      </Pressable>
      <TextInput
        accessibilityLabel={t('chat.placeholder', { name })}
        placeholder={t('chat.placeholder', { name })}
        placeholderTextColor={colors.textMuted}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={1000}
        style={[styles.input, font('400'), { color: colors.text, fontSize: 17 * textScale }]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('chat.send')}
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={send}
        hitSlop={6}
        style={[styles.send, { backgroundColor: canSend ? colors.cta : colors.border }]}
      >
        <Icon name="send" color={canSend ? colors.onCta : colors.textMuted} size={20} />
      </Pressable>
    </View>
  );
}

function Dot({ delay, reduceMotion, color }: { delay: number; reduceMotion: boolean; color: string }) {
  const o = useSharedValue(0.35);
  useEffect(() => {
    if (reduceMotion) return;
    o.value = withDelay(delay, withRepeat(withSequence(withTiming(1, { duration: 350 }), withTiming(0.35, { duration: 350 })), -1));
    return () => cancelAnimation(o);
  }, [delay, reduceMotion, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

export function TypingIndicator({ name }: { name: string }) {
  const { t } = useTranslation();
  const { colors, reduceMotion } = useTheme();
  return (
    <View style={styles.typing} accessible accessibilityLabel={t('chat.typing', { name })} accessibilityLiveRegion="polite">
      <View style={{ width: 30 }} />
      {[0, 150, 300].map((d) => (
        <Dot key={d} delay={d} reduceMotion={reduceMotion} color={colors.textMuted} />
      ))}
      <AppText variant="caption" tone="muted" style={{ marginLeft: spacing.xs }}>
        {t('chat.typing', { name })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Never grow vertically: chips keep their natural height. */
  quickScroll: { flexGrow: 0, flexShrink: 0 },
  quick: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, alignItems: 'center' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: spacing.md,
    borderWidth: 1.5,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  input: { flex: 1, minHeight: 40, maxHeight: 140, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  send: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', minWidth: 40 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm, minHeight: MIN_TOUCH / 2 },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
