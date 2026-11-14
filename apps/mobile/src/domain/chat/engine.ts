import type { InterventionId } from '../entities';
import { detectEmotions, detectIntent, parseMood, parseYesNo, type Intent } from './intents';
import { checkInResponseKey, greetingParts } from './messages';
import type {
  ChatCard,
  ChatContext,
  ChatEvent,
  ChatFlowState,
  EngineResult,
  NewChatMessage,
  QuickReplyId,
  TextPart,
} from './types';
import { INITIAL_FLOW } from './types';

/**
 * Simulated companion conversation (pure, deterministic, testable).
 *
 * - Guided check-in inside the chat: mood → feelings → optional note → safety question → saved
 *   to the journal (same CheckIn model used by the priority score).
 * - Free text is routed by simple intents to the existing screens (cards).
 * - Crisis language or a "yes" to the safety question → crisis card + urgent alert, always.
 * - The companion SUGGESTS a consultation when the trend looks worrying; it never creates one.
 */
const say = (key: string, params?: TextPart['params'], extra: Partial<NewChatMessage> = {}): NewChatMessage => ({
  role: 'companion',
  parts: [{ key, params }],
  ...extra,
});

const card = (c: ChatCard, extra: Partial<NewChatMessage> = {}): NewChatMessage => ({ role: 'companion', card: c, ...extra });

const MAIN_REPLIES: QuickReplyId[] = ['checkin', 'relax', 'progress', 'care'];

function crisis(flow: ChatFlowState, effects: EngineResult['effects']): EngineResult {
  return {
    messages: [say('chat.reply.crisis'), card({ type: 'crisis' })],
    flow: { ...INITIAL_FLOW, relaxCount: flow.relaxCount },
    effects,
  };
}

function startCheckIn(flow: ChatFlowState): EngineResult {
  return {
    messages: [say('chat.flow.askMood', undefined, { card: { type: 'mood' } })],
    flow: { ...flow, step: 'mood', draft: { emotions: [] } },
    effects: [],
  };
}

function suggestConsult(ctx: ChatContext): NewChatMessage[] {
  if (ctx.priorityLevel === 'low' || ctx.hasOpenRequest) return [];
  return [say('companion.suggestConsult', { name: ctx.companionName }, { card: { type: 'consult' } })];
}

function nextCalm(ctx: ChatContext, flow: ChatFlowState): InterventionId {
  const options = ctx.calmInterventions.length ? ctx.calmInterventions : (['breathing'] as InterventionId[]);
  return options[flow.relaxCount % options.length];
}

function handleIntent(intent: Intent, ctx: ChatContext, flow: ChatFlowState): EngineResult {
  const idle = { ...flow, step: 'idle' as const, draft: { emotions: [] } };
  const result = (messages: NewChatMessage[], nextFlow: ChatFlowState = idle): EngineResult => ({
    messages,
    flow: nextFlow,
    effects: [],
  });

  switch (intent) {
    case 'crisis':
      return crisis(flow, [{ type: 'raiseAlert' }]);
    case 'checkin':
      return startCheckIn(flow);
    case 'care':
      return result([say(ctx.hasOpenRequest ? 'chat.reply.careOpen' : 'chat.reply.care', undefined, { card: { type: 'consult' } })]);
    case 'progress':
      return result([say('chat.reply.progress', undefined, { card: { type: 'insights' } })]);
    case 'plan':
      return result([say('chat.reply.plan', undefined, { card: { type: 'plan' } })]);
    case 'relax': {
      const id = nextCalm(ctx, flow);
      return result(
        [say('chat.reply.relax', undefined, { card: { type: 'intervention', id }, quickReplies: ['relax', 'checkin'] })],
        { ...idle, relaxCount: flow.relaxCount + 1 },
      );
    }
    case 'anxious':
      return result([
        say('chat.reply.anxious', undefined, { card: { type: 'intervention', id: 'breathing' }, quickReplies: ['checkin', 'care'] }),
      ]);
    case 'low':
      return result([
        say('chat.reply.low', undefined, { card: { type: 'intervention', id: ctx.suggestedIntervention }, quickReplies: ['checkin', 'care'] }),
        ...suggestConsult(ctx),
      ]);
    case 'tired':
      return result([
        say('chat.reply.tired', undefined, { card: { type: 'intervention', id: nextCalm(ctx, flow) }, quickReplies: ['checkin', 'plan'] }),
      ]);
    case 'positive':
      return result([say('chat.reply.positive', undefined, { quickReplies: ['checkin', 'plan'] })]);
    case 'thanks':
      return result([say('chat.reply.thanks')]);
    case 'greeting':
      return result([say('chat.reply.greeting', undefined, { quickReplies: MAIN_REPLIES })]);
    default:
      return result([say('chat.reply.fallback', { name: ctx.companionName }, { quickReplies: MAIN_REPLIES })]);
  }
}

const QUICK_TO_INTENT: Record<Exclude<QuickReplyId, 'skip'>, Intent> = {
  checkin: 'checkin',
  relax: 'relax',
  low: 'low',
  anxious: 'anxious',
  progress: 'progress',
  care: 'care',
  plan: 'plan',
};

function askSafety(flow: ChatFlowState, note?: string): EngineResult {
  return {
    messages: [say('chat.flow.askSafety', undefined, { card: { type: 'safety' } })],
    flow: { ...flow, step: 'safety', draft: { ...flow.draft, note } },
    effects: [],
  };
}

function finishCheckIn(answer: boolean, ctx: ChatContext, flow: ChatFlowState): EngineResult {
  const { mood = 3, emotions, note } = flow.draft;
  const effects: EngineResult['effects'] = [{ type: 'saveCheckIn', mood, emotions, note, safetyConcern: answer }];
  if (answer) return crisis(flow, effects);
  return {
    messages: [
      say(checkInResponseKey(mood, false), undefined, { card: { type: 'entry', checkInId: 'pending' } }),
      say('chat.flow.suggestion', undefined, { card: { type: 'intervention', id: ctx.suggestedIntervention } }),
      ...suggestConsult(ctx),
    ],
    flow: { ...INITIAL_FLOW, relaxCount: flow.relaxCount },
    effects,
  };
}

export function handleEvent(event: ChatEvent, flow: ChatFlowState, ctx: ChatContext): EngineResult {
  // Crisis language wins in every step.
  if (event.type === 'text' && detectIntent(event.text) === 'crisis') {
    if (flow.step !== 'idle' && flow.draft.mood) {
      return crisis(flow, [{ type: 'saveCheckIn', mood: flow.draft.mood, emotions: flow.draft.emotions, note: event.text, safetyConcern: true }]);
    }
    return crisis(flow, [{ type: 'raiseAlert' }]);
  }

  switch (event.type) {
    case 'open': {
      const greeting: NewChatMessage = {
        role: 'companion',
        parts: greetingParts({
          species: ctx.species,
          timeOfDay: ctx.timeOfDay,
          lastMood: ctx.lastMood,
          daysSinceLastCheckIn: ctx.daysSinceLastCheckIn,
          daylightHours: ctx.daylightHours,
        }),
      };
      const invite = ctx.checkedInToday
        ? say('chat.open.done', undefined, { quickReplies: ['relax', 'plan', 'progress', 'care'] })
        : say('chat.open.invite', undefined, { quickReplies: ['checkin', 'relax', 'low', 'progress'] });
      return { messages: [greeting, invite, ...suggestConsult(ctx)], flow: { ...INITIAL_FLOW, relaxCount: flow.relaxCount }, effects: [] };
    }

    case 'mood':
      return {
        messages: [say('chat.flow.askEmotions', undefined, { card: { type: 'emotions' } })],
        flow: { ...flow, step: 'emotions', draft: { emotions: [], mood: event.mood } },
        effects: [],
      };

    case 'emotions':
      return {
        messages: [say('chat.flow.askNote', undefined, { quickReplies: ['skip'] })],
        flow: { ...flow, step: 'note', draft: { ...flow.draft, emotions: event.emotions } },
        effects: [],
      };

    case 'safety':
      return finishCheckIn(event.answer, ctx, flow);

    case 'quick': {
      if (event.id === 'skip') {
        if (flow.step === 'emotions') return handleEvent({ type: 'emotions', emotions: [] }, flow, ctx);
        if (flow.step === 'note') return askSafety(flow);
        return handleIntent('unknown', ctx, flow);
      }
      return handleIntent(QUICK_TO_INTENT[event.id], ctx, flow);
    }

    case 'text': {
      const text = event.text.trim();
      switch (flow.step) {
        case 'mood': {
          const mood = parseMood(text);
          if (mood) return handleEvent({ type: 'mood', mood }, flow, ctx);
          return { messages: [say('chat.flow.didntGetMood', undefined, { card: { type: 'mood' } })], flow, effects: [] };
        }
        case 'emotions': {
          const emotions = detectEmotions(text);
          if (emotions.length) {
            const next = handleEvent({ type: 'emotions', emotions }, flow, ctx);
            return next;
          }
          return askSafety(flow, text);
        }
        case 'note':
          return askSafety(flow, text);
        case 'safety': {
          const answer = parseYesNo(text);
          if (answer !== null) return finishCheckIn(answer, ctx, flow);
          return { messages: [say('chat.flow.askSafety', undefined, { card: { type: 'safety' } })], flow, effects: [] };
        }
        default:
          return handleIntent(detectIntent(text), ctx, flow);
      }
    }
  }
}
