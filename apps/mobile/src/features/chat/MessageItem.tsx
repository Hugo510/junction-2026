import type { TFunction } from 'i18next';
import { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ChatMessage } from '../../domain/chat/types';
import type { CompanionSpecies, Scale5 } from '../../domain/entities';
import { AppText, Avatar, radii, spacing, useTheme } from '../../ui';
import { useBackend } from '../../store/backend';
import { useSettings } from '../../store/settings';
import { ChatCardView, type ChatCardHandlers } from './ChatCards';
import { ListenButton } from './ListenButton';

export function messageText(m: ChatMessage, t: TFunction): string {
  if (m.text) return m.text;
  return (m.parts ?? []).map((p) => t(p.key, p.params ?? {})).join(m.joiner ?? ' ');
}

const AVATAR = 28;

interface Props {
  message: ChatMessage;
  species: CompanionSpecies;
  showAvatar: boolean;
  cardActive: boolean;
  draftMood?: Scale5;
  handlers: ChatCardHandlers;
}

/**
 * ChatGPT-like layout: the user's messages are soft bubbles on the right,
 * the companion's are plain text on the left with a small avatar on the first of a group.
 * Memoized: only re-renders when its own message or active state changes.
 */
export const MessageItem = memo(
  function MessageItem({ message, species, showAvatar, cardActive, draftMood, handlers }: Props) {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const text = messageText(message, t);
    // Voice is opt-in and only for what the companion says (never the crisis message).
    const voiceWanted = useSettings((s) => s.companionVoice);
    const voiceReady = useBackend((s) => s.voice);
    const canListen = voiceWanted && voiceReady && message.role === 'companion' && !!text && message.card?.type !== 'crisis' && !message.parts?.some((p) => p.key === 'chat.reply.crisis');

    if (message.role === 'user') {
      return (
        <View style={styles.userRow}>
          <View style={[styles.userBubble, { backgroundColor: colors.primarySoft }]}>
            <AppText>{text}</AppText>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.companionRow}>
        <View style={{ width: AVATAR }}>{showAvatar ? <Avatar species={species} size={AVATAR} /> : null}</View>
        <View style={styles.companionContent}>
          {text ? <AppText>{text}</AppText> : null}
          {message.ai ? (
            <AppText variant="caption" tone="muted">
              {t('chat.aiLabel')}
            </AppText>
          ) : null}
          {canListen ? <ListenButton text={text} companion={species} /> : null}
          {message.card ? <ChatCardView card={message.card} active={cardActive} mood={cardActive ? draftMood : undefined} handlers={handlers} /> : null}
        </View>
      </View>
    );
  },
  (a, b) =>
    a.message === b.message &&
    a.showAvatar === b.showAvatar &&
    a.cardActive === b.cardActive &&
    a.species === b.species &&
    a.handlers === b.handlers &&
    (!a.cardActive || a.draftMood === b.draftMood),
);

const styles = StyleSheet.create({
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingLeft: spacing.xxl },
  userBubble: { borderRadius: radii.lg, borderBottomRightRadius: radii.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, maxWidth: '100%' },
  companionRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  companionContent: { flex: 1, gap: spacing.sm, paddingTop: 2 },
});
