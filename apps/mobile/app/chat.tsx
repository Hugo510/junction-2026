import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { ChatEvent, ChatMessage, InteractiveCard } from '../src/domain/chat/types';
import { toISODate } from '../src/domain/dates';
import { Composer, QuickReplies, TypingIndicator } from '../src/features/chat/Composer';
import { MessageItem } from '../src/features/chat/MessageItem';
import { SideMenu } from '../src/features/chat/SideMenu';
import { useChatContext } from '../src/features/chat/useChatContext';
import { capitalizeFirst, formatDate } from '../src/i18n';
import { useToday } from '../src/store/clock';
import { useChat } from '../src/store/chat';
import { useData } from '../src/store/data';
import { AppText, Avatar, HelpButton, Icon, MIN_TOUCH, spacing, useTheme } from '../src/ui';

type Row = { kind: 'day'; id: string; date: string } | { kind: 'msg'; id: string; message: ChatMessage; showAvatar: boolean };

const INTERACTIVE: InteractiveCard[] = ['mood', 'emotions', 'safety'];

/** Home screen: talk to your companion. Everything else opens from here. */
export default function ChatScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const patient = useData((s) => s.patient);
  const ctx = useChatContext();
  const today = useToday();
  const { loaded, messages, flow, typing, load, openSession, send } = useChat();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  // Greet once per (simulated) day.
  const hasCtx = !!ctx;
  useEffect(() => {
    if (loaded && ctx) void openSession(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, hasCtx, today]);

  const dispatch = useCallback(
    async (event: ChatEvent) => {
      if (!ctx || typing) return;
      const { urgent } = await send(event, ctx);
      if (urgent) router.push({ pathname: '/crisis', params: { urgent: '1' } });
    },
    [ctx, typing, send],
  );

  // Only the latest interactive card that matches the current step is active.
  const activeCardId = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.card && INTERACTIVE.includes(m.card.type as InteractiveCard));
    return last && last.card?.type === flow.step ? last.id : null;
  }, [messages, flow.step]);

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let lastDay = '';
    let prevRole: ChatMessage['role'] | null = null;
    for (const m of messages) {
      const day = toISODate(new Date(m.createdAt));
      if (day !== lastDay) {
        out.push({ kind: 'day', id: `day-${day}`, date: day });
        lastDay = day;
        prevRole = null;
      }
      out.push({ kind: 'msg', id: m.id, message: m, showAvatar: m.role === 'companion' && prevRole !== 'companion' });
      prevRole = m.role;
    }
    return out.reverse(); // inverted list
  }, [messages]);

  // Suggestions from the companion's latest turn (until the user answers).
  const quickReplies = useMemo(() => {
    if (typing) return [];
    for (let i = messages.length - 1; i >= 0 && messages[i].role === 'companion'; i--) {
      if (messages[i].quickReplies?.length) return messages[i].quickReplies ?? [];
    }
    return [];
  }, [messages, typing]);

  if (!patient) return <Redirect href="/start" />;
  const name = patient.companion.name;

  const dayLabel = (iso: string) => {
    const diff = Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${iso}T12:00:00`).getTime()) / 86_400_000);
    if (diff === 0) return t('common.today');
    if (diff === 1) return t('common.yesterday');
    return capitalizeFirst(formatDate(new Date(`${iso}T12:00:00`), 'EEEE d MMMM'));
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('chat.menu')} onPress={() => setMenuOpen(true)} hitSlop={6} style={styles.iconButton}>
          <Icon name="menu" color={colors.text} />
        </Pressable>
        <View style={styles.title} accessible accessibilityLabel={t('a11y.companion', { species: t(`species.${patient.companion.species}`), name })}>
          <Avatar species={patient.companion.species} size={32} />
          <AppText variant="heading" numberOfLines={1}>
            {name}
          </AppText>
        </View>
        <HelpButton compact />
      </View>

      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          inverted
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={typing ? <TypingIndicator name={name} /> : undefined}
          ListFooterComponent={
            <View style={styles.hero}>
              <Avatar species={patient.companion.species} size={88} animated />
              <AppText variant="title" align="center">
                {name}
              </AppText>
              <AppText variant="caption" tone="muted" align="center">
                {t('chat.heroSubtitle')}
              </AppText>
            </View>
          }
          renderItem={({ item }) =>
            item.kind === 'day' ? (
              <AppText variant="caption" tone="muted" align="center" style={styles.day}>
                {dayLabel(item.date)}
              </AppText>
            ) : (
              <MessageItem
                message={item.message}
                species={patient.companion.species}
                showAvatar={item.showAvatar}
                cardActive={item.message.id === activeCardId && !typing}
                handlers={{
                  onMood: (mood) => dispatch({ type: 'mood', mood }),
                  onEmotions: (emotions) => dispatch({ type: 'emotions', emotions }),
                  onSafety: (answer) => dispatch({ type: 'safety', answer }),
                }}
              />
            )
          }
        />

        <QuickReplies ids={quickReplies} onPick={(id) => dispatch({ type: 'quick', id })} />
        <Composer name={name} disabled={typing} onSend={(text) => dispatch({ type: 'text', text })} />
        <AppText variant="caption" tone="muted" align="center" style={styles.disclaimer}>
          {t('chat.disclaimer', { name })}
        </AppText>
      </KeyboardAvoidingView>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  iconButton: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  list: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.md },
  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg },
  day: { marginVertical: spacing.xs },
  disclaimer: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.xs },
});
