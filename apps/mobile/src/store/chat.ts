import { create } from 'zustand';

import { repositories } from '../data';
import { handleEvent } from '../domain/chat/engine';
import { INITIAL_FLOW, type ChatContext, type ChatEvent, type ChatFlowState, type ChatMessage, type NewChatMessage, type TextPart } from '../domain/chat/types';
import { toISODate } from '../domain/dates';
import type { NoticeKind } from '../domain/outreach';
import { now } from './clock';
import { useData } from './data';

interface ChatState {
  loaded: boolean;
  messages: ChatMessage[];
  flow: ChatFlowState;
  typing: boolean;
  load: () => Promise<void>;
  /** Greets once per day (and the very first time). */
  openSession: (ctx: ChatContext) => Promise<void>;
  /** Sends a user event; returns whether the urgent path was triggered. */
  send: (event: ChatEvent, ctx: ChatContext) => Promise<{ urgent: boolean }>;
  /** Adds the words behind a tapped notification, when today's conversation already started. */
  deliver: (kind: NoticeKind) => Promise<void>;
  reset: () => Promise<void>;
}

/** What the companion says in the chat for each notification (daily / evening need nothing extra). */
const NOTICE_MESSAGES: Partial<Record<NoticeKind, NewChatMessage>> = {
  drift: { role: 'companion', parts: [{ key: 'chat.phq.offer' }], quickReplies: ['phq', 'notNow'] },
  warm: { role: 'companion', parts: [{ key: 'chat.outreach.warm' }] },
  friend: { role: 'companion', parts: [{ key: 'chat.outreach.friend' }], card: { type: 'friend' } },
  reconnect: { role: 'companion', parts: [{ key: 'chat.outreach.reconnect' }], card: { type: 'reconnect' } },
};

const newId = () => `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** What the user "said" for each event, shown as their bubble. */
function echo(event: ChatEvent): Omit<ChatMessage, 'id' | 'createdAt'> | null {
  switch (event.type) {
    case 'text':
      return { role: 'user', text: event.text.trim() };
    case 'quick':
      return { role: 'user', parts: [{ key: `chat.quick.${event.id}` }] };
    case 'mood':
      return { role: 'user', parts: [{ key: `checkin.mood.levels.${event.mood}` }] };
    case 'emotions':
      return event.emotions.length
        ? { role: 'user', parts: event.emotions.map<TextPart>((e) => ({ key: `emotions.${e}` })), joiner: ', ' }
        : { role: 'user', parts: [{ key: 'chat.quick.skip' }] };
    case 'safety':
      return { role: 'user', parts: [{ key: event.answer ? 'common.yes' : 'common.no' }] };
    case 'phq':
      return { role: 'user', parts: [{ key: `phq.options.${event.value}` }] };
    default:
      return null;
  }
}

export const useChat = create<ChatState>()((set, get) => {
  const stamp = (m: NewChatMessage | Omit<ChatMessage, 'id' | 'createdAt'>): ChatMessage => ({
    ...m,
    id: newId(),
    createdAt: now().toISOString(),
  });
  const persist = () => repositories.chat.save(get().messages);

  return {
    loaded: false,
    messages: [],
    flow: INITIAL_FLOW,
    typing: false,

    load: async () => {
      if (get().loaded) return;
      const messages = await repositories.chat.list();
      set({ messages, loaded: true });
    },

    openSession: async (ctx) => {
      const { messages } = get();
      const last = messages[messages.length - 1];
      const today = toISODate(now());
      if (last && toISODate(new Date(last.createdAt)) === today) return;
      const result = handleEvent({ type: 'open' }, INITIAL_FLOW, ctx);
      set({ messages: [...messages, ...result.messages.map(stamp)], flow: result.flow });
      await persist();
    },

    send: async (event, ctx) => {
      const userMessage = echo(event);
      // Taps on cards/chips get an instant answer; only typed messages show "typing…".
      const isText = event.type === 'text';
      set({ messages: userMessage ? [...get().messages, stamp(userMessage)] : get().messages, typing: isText });

      const result = handleEvent(event, get().flow, ctx);
      let urgent = false;
      let savedId: string | undefined;
      const data = useData.getState();
      for (const effect of result.effects) {
        if (effect.type === 'saveCheckIn') {
          const { checkIn, risk } = await data.submitCheckIn({
            kind: 'chat',
            mood: effect.mood,
            emotions: effect.emotions,
            note: effect.note,
            safetyConcern: effect.safetyConcern,
          });
          savedId = checkIn.id;
          urgent = urgent || risk.level === 'urgent';
        } else if (effect.type === 'savePhq') {
          await data.addPhq(effect.items);
        } else if (effect.type === 'raiseAlert') {
          await data.raiseAlert('chat');
          urgent = true;
        }
      }

      // Short pause proportional to what the user wrote (never for urgent paths).
      if (isText && !urgent) await wait(Math.min(700, 280 + event.text.length * 6));
      const replies = result.messages.map((m) =>
        m.card?.type === 'entry' ? { ...m, card: { type: 'entry' as const, checkInId: savedId ?? '' } } : m,
      );
      set({ messages: [...get().messages, ...replies.map(stamp)], flow: result.flow, typing: false });
      await persist();
      return { urgent };
    },

    deliver: async (kind) => {
      await get().load();
      const message = NOTICE_MESSAGES[kind];
      const { messages } = get();
      const last = messages[messages.length - 1];
      // On a new day the chat's own opening already carries these words.
      if (!message || !last || toISODate(new Date(last.createdAt)) !== toISODate(now())) return;
      const key = message.parts?.[0].key;
      if (last.parts?.some((p) => p.key === key)) return;
      set({ messages: [...messages, stamp(message)] });
      await persist();
    },

    reset: async () => {
      await repositories.chat.clear();
      set({ messages: [], flow: INITIAL_FLOW, typing: false, loaded: true });
    },
  };
});
