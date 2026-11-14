import type { TFunction } from 'i18next';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ChatMessage } from '../../domain/chat/types';
import type { CompanionSpecies } from '../../domain/entities';
import { AppText, Avatar, radii, spacing, useTheme } from '../../ui';
import { ChatCardView, type ChatCardHandlers } from './ChatCards';

export function messageText(m: ChatMessage, t: TFunction): string {
  if (m.text) return m.text;
  return (m.parts ?? []).map((p) => t(p.key, p.params ?? {})).join(m.joiner ?? ' ');
}

const AVATAR = 30;

/**
 * ChatGPT-like layout: the user's messages are soft bubbles on the right,
 * the companion's are plain text on the left with a small avatar on the first of a group.
 */
export function MessageItem({
  message,
  species,
  showAvatar,
  cardActive,
  handlers,
}: {
  message: ChatMessage;
  species: CompanionSpecies;
  showAvatar: boolean;
  cardActive: boolean;
  handlers: ChatCardHandlers;
}) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const text = messageText(message, t);

  if (message.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={[styles.userBubble, { backgroundColor: colors.surfaceAlt }]}>
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
        {message.card ? <ChatCardView card={message.card} active={cardActive} handlers={handlers} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingLeft: spacing.xxl },
  userBubble: { borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, maxWidth: '100%' },
  companionRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  companionContent: { flex: 1, gap: spacing.sm, paddingTop: 4 },
});
