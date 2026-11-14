import type { InterventionId } from '../entities';
import { phqBand, phqTotal, shouldContinueToPhq9 } from '../phq';
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
 * - Daily moment: Hiillos speaks first → ONE mood tap → one small step. That is the whole
 *   daily check-in. A low mood (≤ 2) adds the safety question.
 * - The longer check-in (feelings, sleep, energy, tap game) is weekly, by invitation.
 * - Drift: when the priority reaches medium, Hiillos reaches out with two quick questions
 *   (PHQ-2), continuing to the full PHQ-9 only if needed. Sensors only ask; the questionnaire
 *   decides whether talking to the care team is suggested. Nothing is sent to the clinic from
 *   signals alone, and the companion never creates a consultation by itself.
 * - "Check in with me" still runs the guided flow: mood → feelings → note → safety.
 * - Crisis language, a "yes" to the safety question or PHQ item 9 > 0 → crisis card + urgent alert.
 */
const say = (key: string, params?: TextPart['params'], extra: Partial<NewChatMessage> = {}): NewChatMessage => ({
  role: 'companion',
  parts: [{ key, params }],
  ...extra,
});

const card = (c: ChatCard, extra: Partial<NewChatMessage> = {}): NewChatMessage => ({ role: 'companion', card: c, ...extra });

const MAIN_REPLIES: QuickReplyId[] = ['checkin', 'relax', 'progress', 'care'];
const AFTER_STEP: QuickReplyId[] = ['relax', 'plan', 'progress'];

const reset = (flow: ChatFlowState): ChatFlowState => ({ ...INITIAL_FLOW, relaxCount: flow.relaxCount });

function crisis(flow: ChatFlowState, effects: EngineResult['effects']): EngineResult {
  return { messages: [say('chat.reply.crisis'), card({ type: 'crisis' })], flow: reset(flow), effects };
}

function startCheckIn(flow: ChatFlowState): EngineResult {
  return {
    messages: [say('chat.flow.askMood', undefined, { card: { type: 'mood' } })],
    flow: { ...reset(flow), step: 'mood' },
    effects: [],
  };
}

/** Questionnaires decide: only a recent PHQ-9 ≥ 10 makes the companion suggest the care team. */
function suggestConsult(ctx: ChatContext): NewChatMessage[] {
  if (!ctx.phqConcern || ctx.hasOpenRequest) return [];
  return [say('companion.suggestConsult', { name: ctx.companionName }, { card: { type: 'consult' } })];
}

function nextCalm(ctx: ChatContext, flow: ChatFlowState): InterventionId {
  const options = ctx.calmInterventions.length ? ctx.calmInterventions : (['breathing'] as InterventionId[]);
  return options[flow.relaxCount % options.length];
}

/** Today's one-tap mood question (used on open and after "not now"). */
function dailyMoodAsk(parts: TextPart[], quickReplies: QuickReplyId[]): NewChatMessage {
  return { role: 'companion', parts, card: { type: 'mood' }, quickReplies };
}

function handleIntent(intent: Intent, ctx: ChatContext, flow: ChatFlowState): EngineResult {
  // Keep today's one-tap mood card answerable while the person explores other things.
  const keepDaily = !!flow.daily && flow.step === 'mood';
  const idle: ChatFlowState = keepDaily ? flow : reset(flow);
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
        say('chat.reply.low', undefined, {
          card: { type: 'intervention', id: ctx.suggestedIntervention },
          quickReplies: ctx.phqDue ? ['phq', 'care'] : ['checkin', 'care'],
        }),
        ...suggestConsult(ctx),
      ]);
    case 'tired':
      return result([
        say('chat.reply.tired', undefined, { card: { type: 'intervention', id: nextCalm(ctx, flow) }, quickReplies: ['checkin', 'plan'] }),
      ]);
    case 'positive':
      // With clinic-flagged upward drift, never cheer it on: calm tone, protect sleep.
      if (ctx.upwardDrift) return result([say('chat.reply.steady', undefined, { quickReplies: ['checkin', 'relax'] })]);
      return result([say('chat.reply.positive', undefined, { quickReplies: ['checkin', 'plan'] })]);
    case 'thanks':
      return result([say('chat.reply.thanks')]);
    case 'greeting':
      return result([say('chat.reply.greeting', undefined, { quickReplies: MAIN_REPLIES })]);
    default:
      return result([say('chat.reply.fallback', { name: ctx.companionName }, { quickReplies: MAIN_REPLIES })]);
  }
}

const QUICK_TO_INTENT: Record<Exclude<QuickReplyId, 'skip' | 'phq' | 'notNow'>, Intent> = {
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
  const responseKey = ctx.upwardDrift && mood >= 4 ? 'companion.checkin.steady' : checkInResponseKey(mood, false);
  const stepCard: ChatCard = { type: 'intervention', id: ctx.suggestedIntervention };

  const messages: NewChatMessage[] = flow.daily
    ? [
        // Daily moment: one warm line + one small step. Nothing else is asked today.
        { role: 'companion', parts: [{ key: responseKey }, { key: 'chat.flow.suggestion' }], card: stepCard, quickReplies: AFTER_STEP },
        ...(ctx.weeklyDue ? [say('chat.weekly.invite', undefined, { card: { type: 'weekly' } })] : []),
      ]
    : [
        say(responseKey, undefined, { card: { type: 'entry', checkInId: 'pending' } }),
        say('chat.flow.suggestion', undefined, { card: stepCard }),
      ];

  return { messages: [...messages, ...suggestConsult(ctx)], flow: reset(flow), effects };
}

/* ---------- PHQ-2 → PHQ-9 ---------- */

function phqQuestion(item: number, bridge = false): NewChatMessage {
  const parts: TextPart[] = bridge ? [{ key: 'chat.phq.more' }, { key: `phq.items.${item}` }] : [{ key: `phq.items.${item}` }];
  return { role: 'companion', parts, card: { type: 'phq', item } };
}

function startPhq(flow: ChatFlowState): EngineResult {
  return {
    messages: [say('chat.phq.intro'), phqQuestion(1)],
    flow: { ...reset(flow), step: 'phq', phq: [] },
    effects: [],
  };
}

function finishPhq(answers: number[], ctx: ChatContext, flow: ChatFlowState): EngineResult {
  const effects: EngineResult['effects'] = [{ type: 'savePhq', items: answers }];
  // Item 9 (thoughts of self-harm) uses the fixed safety rule.
  if (answers.length === 9 && answers[8] > 0) return crisis(flow, [...effects, { type: 'raiseAlert' }]);

  const band = answers.length === 9 ? phqBand(phqTotal(answers)) : 'low';
  const messages: NewChatMessage[] =
    band === 'high'
      ? [say('chat.phq.doneHigh', undefined, { card: { type: 'consult' }, quickReplies: AFTER_STEP })]
      : [
          say(band === 'mid' ? 'chat.phq.doneMid' : 'chat.phq.doneLow', undefined, {
            card: { type: 'intervention', id: ctx.suggestedIntervention },
            quickReplies: AFTER_STEP,
          }),
        ];
  return { messages, flow: reset(flow), effects };
}

function answerPhq(value: number, ctx: ChatContext, flow: ChatFlowState): EngineResult {
  const answers = [...(flow.phq ?? []), Math.max(0, Math.min(3, Math.round(value)))];
  const n = answers.length;
  if (n === 2 && !shouldContinueToPhq9(answers)) return finishPhq(answers, ctx, flow);
  if (n >= 9) return finishPhq(answers, ctx, flow);
  return { messages: [phqQuestion(n + 1, n === 2)], flow: { ...flow, step: 'phq', phq: answers }, effects: [] };
}

/* ---------- main entry ---------- */

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
      const suggestCare = ctx.phqConcern && !ctx.hasOpenRequest;
      const greeting = greetingParts({
        species: ctx.species,
        timeOfDay: ctx.timeOfDay,
        lastMood: ctx.lastMood,
        daysSinceLastCheckIn: ctx.daysSinceLastCheckIn,
        daylightHours: ctx.daylightHours,
      });
      const last = greeting.length - 1;

      // Drift: reach out with two quick questions. Not during the silence ladder (go gentle first).
      if (ctx.phqDue && ctx.outreach === 'none') {
        greeting[last] = { key: 'chat.phq.offer' };
        return { messages: [{ role: 'companion', parts: greeting, quickReplies: ['phq', 'notNow'] }], flow: reset(flow), effects: [] };
      }

      // Silence ladder: the context line becomes a warmer outreach message (never crisis language).
      if (ctx.outreach !== 'none') greeting[last] = { key: `chat.outreach.${ctx.outreach}` };
      const outreachCard: ChatCard | undefined =
        ctx.outreach === 'reconnect' ? { type: 'reconnect' } : ctx.outreach === 'friend' ? { type: 'friend' } : undefined;

      if (ctx.checkedInToday) {
        const parts: TextPart[] = [...greeting, { key: 'chat.open.done' }];
        if (suggestCare && ctx.outreach === 'none') parts.push({ key: 'chat.open.careHint' });
        const quickReplies: QuickReplyId[] = suggestCare ? ['care', 'relax', 'plan', 'progress'] : ['relax', 'plan', 'progress', 'care'];
        return { messages: [{ role: 'companion', parts, quickReplies, card: outreachCard }], flow: reset(flow), effects: [] };
      }

      // Daily moment: Hiillos speaks first and asks for one mood tap.
      const quickReplies: QuickReplyId[] = suggestCare ? ['care', 'relax', 'plan'] : AFTER_STEP;
      const messages: NewChatMessage[] = outreachCard
        ? [{ role: 'companion', parts: greeting, card: outreachCard }, dailyMoodAsk([{ key: 'chat.open.invite' }], quickReplies)]
        : [dailyMoodAsk([...greeting, { key: 'chat.open.invite' }], quickReplies)];
      return { messages, flow: { ...reset(flow), step: 'mood', daily: true }, effects: [] };
    }

    case 'mood': {
      if (flow.daily) {
        const tapped: ChatFlowState = { ...flow, draft: { emotions: [], mood: event.mood } };
        // A low day adds the safety question; otherwise one tap is the whole check-in.
        return event.mood <= 2 ? askSafety(tapped) : finishCheckIn(false, ctx, tapped);
      }
      return {
        messages: [say('chat.flow.askEmotions', undefined, { card: { type: 'emotions' } })],
        flow: { ...flow, step: 'emotions', draft: { emotions: [], mood: event.mood } },
        effects: [],
      };
    }

    case 'emotions':
      return {
        messages: [say('chat.flow.askNote', undefined, { quickReplies: ['skip'] })],
        flow: { ...flow, step: 'note', draft: { ...flow.draft, emotions: event.emotions } },
        effects: [],
      };

    case 'safety':
      return finishCheckIn(event.answer, ctx, flow);

    case 'phq':
      return flow.step === 'phq' ? answerPhq(event.value, ctx, flow) : startPhq(flow);

    case 'quick': {
      if (event.id === 'skip') {
        if (flow.step === 'emotions') return handleEvent({ type: 'emotions', emotions: [] }, flow, ctx);
        if (flow.step === 'note') return askSafety(flow);
        return handleIntent('unknown', ctx, flow);
      }
      if (event.id === 'phq') return startPhq(flow);
      if (event.id === 'notNow') {
        // No pressure: fall back to today's one-tap moment (or just acknowledge).
        if (ctx.checkedInToday) return { messages: [say('chat.phq.later', undefined, { quickReplies: AFTER_STEP })], flow: reset(flow), effects: [] };
        return {
          messages: [dailyMoodAsk([{ key: 'chat.phq.later' }, { key: 'chat.open.invite' }], AFTER_STEP)],
          flow: { ...reset(flow), step: 'mood', daily: true },
          effects: [],
        };
      }
      return handleIntent(QUICK_TO_INTENT[event.id], ctx, flow);
    }

    case 'text': {
      const text = event.text.trim();
      switch (flow.step) {
        case 'mood': {
          if (flow.daily) {
            // Free text during the daily moment is a conversation, not a wrong answer.
            const exact = /^[1-5]$/.test(text) ? parseMood(text) : null;
            return exact ? handleEvent({ type: 'mood', mood: exact }, flow, ctx) : handleIntent(detectIntent(text), ctx, flow);
          }
          const mood = parseMood(text);
          if (mood) return handleEvent({ type: 'mood', mood }, flow, ctx);
          return { messages: [say('chat.flow.didntGetMood', undefined, { card: { type: 'mood' } })], flow, effects: [] };
        }
        case 'emotions': {
          const emotions = detectEmotions(text);
          if (emotions.length) return handleEvent({ type: 'emotions', emotions }, flow, ctx);
          return askSafety(flow, text);
        }
        case 'note':
          return askSafety(flow, text);
        case 'safety': {
          const answer = parseYesNo(text);
          if (answer !== null) return finishCheckIn(answer, ctx, flow);
          return { messages: [say('chat.flow.askSafety', undefined, { card: { type: 'safety' } })], flow, effects: [] };
        }
        case 'phq': {
          if (/^[0-3]$/.test(text)) return answerPhq(Number(text), ctx, flow);
          const item = (flow.phq?.length ?? 0) + 1;
          return { messages: [say('chat.phq.pick', undefined, { card: { type: 'phq', item } })], flow, effects: [] };
        }
        default:
          return handleIntent(detectIntent(text), ctx, flow);
      }
    }
  }
}
