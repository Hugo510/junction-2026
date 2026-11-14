import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import type { ChatEvent, ChatMessage, InteractiveCard, QuickReplyId } from '../../domain/chat/types';
import { toISODate } from '../../domain/dates';
import { useToday } from '../../store/clock';
import { useChat } from '../../store/chat';
import type { ChatCardHandlers } from './ChatCards';
import { useChatContext } from './useChatContext';

export type ChatRow =
  | { kind: 'day'; id: string; date: string }
  | { kind: 'msg'; id: string; message: ChatMessage; showAvatar: boolean };

const INTERACTIVE: InteractiveCard[] = ['mood', 'emotions', 'safety'];

/**
 * View model for the chat screen: loading, daily greeting, sending events, list rows
 * and which interactive card is active. The screen only renders.
 */
export function useChatViewModel() {
  const ctx = useChatContext();
  const today = useToday();
  const loaded = useChat((s) => s.loaded);
  const messages = useChat((s) => s.messages);
  const flow = useChat((s) => s.flow);
  const typing = useChat((s) => s.typing);

  useEffect(() => {
    void useChat.getState().load();
  }, []);

  // Greet once per (simulated) day.
  const hasCtx = !!ctx;
  useEffect(() => {
    if (loaded && ctx) void useChat.getState().openSession(ctx);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, hasCtx, today]);

  // Latest values in refs so callbacks stay stable (no re-render of every message).
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;
  const typingRef = useRef(typing);
  typingRef.current = typing;

  const dispatch = useCallback(async (event: ChatEvent) => {
    const current = ctxRef.current;
    if (!current || typingRef.current) return;
    const { urgent } = await useChat.getState().send(event, current);
    if (urgent) router.push({ pathname: '/crisis', params: { urgent: '1' } });
  }, []);

  const handlers = useMemo<ChatCardHandlers>(
    () => ({
      onMood: (mood) => dispatch({ type: 'mood', mood }),
      onEmotions: (emotions) => dispatch({ type: 'emotions', emotions }),
      onSafety: (answer) => dispatch({ type: 'safety', answer }),
      onQuick: (id) => dispatch({ type: 'quick', id }),
    }),
    [dispatch],
  );
  const sendText = useCallback((text: string) => dispatch({ type: 'text', text }), [dispatch]);
  const sendQuick = useCallback((id: QuickReplyId) => dispatch({ type: 'quick', id }), [dispatch]);

  const activeCardId = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.card && INTERACTIVE.includes(m.card.type as InteractiveCard));
    return last && last.card?.type === flow.step ? last.id : null;
  }, [messages, flow.step]);

  const rows = useMemo<ChatRow[]>(() => {
    const out: ChatRow[] = [];
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
  const quickReplies = useMemo<QuickReplyId[]>(() => {
    if (typing) return [];
    for (let i = messages.length - 1; i >= 0 && messages[i].role === 'companion'; i--) {
      if (messages[i].quickReplies?.length) return messages[i].quickReplies ?? [];
    }
    return [];
  }, [messages, typing]);

  return { ctx, today, rows, typing, activeCardId, draftMood: flow.draft.mood, quickReplies, handlers, sendText, sendQuick };
}
