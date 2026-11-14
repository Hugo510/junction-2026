import { handleEvent } from '../chat/engine';
import { detectEmotions, detectIntent, parseMood, parseYesNo } from '../chat/intents';
import { INITIAL_FLOW, type ChatContext } from '../chat/types';
import { assessCheckInRisk, detectCrisisLanguage } from '../riskRules';

const ctx: ChatContext = {
  companionName: 'Kuu',
  species: 'cat',
  timeOfDay: 'morning',
  lastMood: 3,
  daysSinceLastCheckIn: 1,
  daylightHours: 7,
  checkedInToday: false,
  priorityLevel: 'low',
  hasOpenRequest: false,
  suggestedIntervention: 'daylightWalk',
  calmInterventions: ['breathing', 'fireplace', 'fish'],
  outreach: 'none',
  upwardDrift: false,
  phqDue: false,
  phqConcern: false,
  weeklyDue: false,
};

describe('crisis language', () => {
  it.each([
    'I want to kill myself',
    'sometimes I think about suicide',
    'Ya no quiero vivir',
    'pienso en hacerme daño',
    'Mietin itsemurhaa',
    'haluan kuolla',
    'jag vill inte leva längre',
    'tankar på självmord',
  ])('detects "%s"', (text) => {
    expect(detectCrisisLanguage(text)).toBe(true);
  });

  it.each(['I am tired today', 'Me siento solo', 'Olen väsynyt', 'Jag vill dock vila', 'This puzzle is killing me softly'])(
    'does not flag "%s"',
    (text) => {
      expect(detectCrisisLanguage(text)).toBe(false);
    },
  );

  it('flags a journal note even without the safety answer', () => {
    expect(assessCheckInRisk({ safetyConcern: false, note: 'no quiero vivir' }).level).toBe('urgent');
    expect(assessCheckInRisk({ safetyConcern: false, note: 'a calm day' }).level).toBe('none');
  });
});

describe('intents', () => {
  it('routes common phrases in 4 languages', () => {
    expect(detectIntent('I feel anxious')).toBe('anxious');
    expect(detectIntent('Me siento triste')).toBe('low');
    expect(detectIntent('Haluan puhua lääkärin kanssa')).toBe('care');
    expect(detectIntent('Hjälp mig att slappna av')).toBe('relax');
    expect(detectIntent('not good today')).toBe('low');
    expect(detectIntent('feeling great!')).toBe('positive');
    expect(detectIntent('qwerty')).toBe('unknown');
  });

  it('parses moods, feelings and yes/no', () => {
    expect(parseMood('maybe a 4/5')).toBe(4);
    expect(parseMood('fine')).toBeNull();
    expect(detectEmotions('Estoy cansada y ansiosa')).toEqual(['tired', 'anxious']);
    expect(parseYesNo('Kyllä')).toBe(true);
    expect(parseYesNo('nej')).toBe(false);
  });
});

describe('chat engine', () => {
  it('daily moment: Hiillos speaks first with one mood tap', () => {
    const r = handleEvent({ type: 'open' }, INITIAL_FLOW, ctx);
    expect(r.messages).toHaveLength(1);
    expect(r.messages[0].parts?.[0].key).toBe('companion.greeting.morning');
    expect(r.messages[0].parts?.map((p) => p.key)).toContain('chat.open.invite');
    expect(r.messages[0].card).toEqual({ type: 'mood' });
    expect(r.flow).toMatchObject({ step: 'mood', daily: true });
  });

  it('daily moment: one tap saves the day and offers one small step, nothing else', () => {
    const open = handleEvent({ type: 'open' }, INITIAL_FLOW, ctx);
    const r = handleEvent({ type: 'mood', mood: 4 }, open.flow, ctx);
    expect(r.effects).toEqual([{ type: 'saveCheckIn', mood: 4, emotions: [], note: undefined, safetyConcern: false }]);
    expect(r.messages).toHaveLength(1);
    expect(r.messages[0].card).toEqual({ type: 'intervention', id: 'daylightWalk' });
    expect(r.flow.step).toBe('idle');
  });

  it('daily moment: a low day adds the safety question before saving', () => {
    const open = handleEvent({ type: 'open' }, INITIAL_FLOW, ctx);
    const low = handleEvent({ type: 'mood', mood: 2 }, open.flow, ctx);
    expect(low.effects).toEqual([]);
    expect(low.messages[0].card).toEqual({ type: 'safety' });
    const yes = handleEvent({ type: 'safety', answer: true }, low.flow, ctx);
    expect(yes.effects[0]).toMatchObject({ type: 'saveCheckIn', mood: 2, safetyConcern: true });
    expect(yes.messages.some((m) => m.card?.type === 'crisis')).toBe(true);
  });

  it('daily moment: free text is a conversation and keeps the mood tap available', () => {
    const open = handleEvent({ type: 'open' }, INITIAL_FLOW, ctx);
    const r = handleEvent({ type: 'text', text: 'I slept 4 hours and feel anxious' }, open.flow, ctx);
    expect(r.effects).toEqual([]);
    expect(r.messages[0].parts?.[0].key).toBe('chat.reply.anxious');
    expect(r.flow).toMatchObject({ step: 'mood', daily: true });
  });

  it('the longer check-in is weekly, by invitation', () => {
    const open = handleEvent({ type: 'open' }, INITIAL_FLOW, { ...ctx, weeklyDue: true });
    const r = handleEvent({ type: 'mood', mood: 3 }, open.flow, { ...ctx, weeklyDue: true });
    expect(r.messages.some((m) => m.card?.type === 'weekly')).toBe(true);
  });

  it('runs the guided check-in and saves a journal entry', () => {
    let r = handleEvent({ type: 'quick', id: 'checkin' }, INITIAL_FLOW, ctx);
    expect(r.flow.step).toBe('mood');
    r = handleEvent({ type: 'mood', mood: 2 }, r.flow, ctx);
    expect(r.flow.step).toBe('emotions');
    r = handleEvent({ type: 'emotions', emotions: ['sad', 'tired'] }, r.flow, ctx);
    expect(r.flow.step).toBe('note');
    r = handleEvent({ type: 'text', text: 'Long week at work' }, r.flow, ctx);
    expect(r.flow.step).toBe('safety');
    r = handleEvent({ type: 'safety', answer: false }, r.flow, ctx);
    expect(r.effects).toEqual([
      { type: 'saveCheckIn', mood: 2, emotions: ['sad', 'tired'], note: 'Long week at work', safetyConcern: false },
    ]);
    expect(r.flow.step).toBe('idle');
    expect(r.messages.some((m) => m.card?.type === 'entry')).toBe(true);
  });

  it('a "yes" to the safety question saves as urgent and shows the crisis card', () => {
    const flow = { ...INITIAL_FLOW, step: 'safety' as const, draft: { mood: 1 as const, emotions: [] } };
    const r = handleEvent({ type: 'safety', answer: true }, flow, ctx);
    expect(r.effects[0]).toMatchObject({ type: 'saveCheckIn', safetyConcern: true });
    expect(r.messages.some((m) => m.card?.type === 'crisis')).toBe(true);
  });

  it('crisis language in free text always raises an alert', () => {
    const r = handleEvent({ type: 'text', text: 'quiero morir' }, INITIAL_FLOW, ctx);
    expect(r.effects).toEqual([{ type: 'raiseAlert' }]);
    expect(r.messages.some((m) => m.card?.type === 'crisis')).toBe(true);
  });

  it('sensors only ask: a high priority alone never suggests the care team', () => {
    const high = { ...ctx, priorityLevel: 'high' as const };
    const open = handleEvent({ type: 'open' }, INITIAL_FLOW, high);
    expect(open.messages.some((m) => m.card?.type === 'consult')).toBe(false);
    expect(open.messages[0].quickReplies).not.toContain('care');
    const low = handleEvent({ type: 'quick', id: 'low' }, INITIAL_FLOW, high);
    expect(low.messages.some((m) => m.card?.type === 'consult')).toBe(false);
  });

  it('questionnaires decide: after a recent PHQ-9 >= 10 it suggests (never creates) a consultation', () => {
    const concern = { ...ctx, phqConcern: true, checkedInToday: true };
    const open = handleEvent({ type: 'open' }, INITIAL_FLOW, concern);
    expect(open.messages[0].quickReplies?.[0]).toBe('care');
    expect(open.messages[0].parts?.map((p) => p.key)).toContain('chat.open.careHint');
    expect(open.effects).toEqual([]);
    const low = handleEvent({ type: 'quick', id: 'low' }, INITIAL_FLOW, concern);
    expect(low.messages.some((m) => m.card?.type === 'consult')).toBe(true);
    expect(low.effects).toEqual([]);
  });

  describe('drift → two quick questions (PHQ-2 → PHQ-9)', () => {
    const drift = { ...ctx, priorityLevel: 'medium' as const, phqDue: true };
    const answer = (values: number[]) => {
      let r = handleEvent({ type: 'quick', id: 'phq' }, INITIAL_FLOW, drift);
      for (const value of values) r = handleEvent({ type: 'phq', value }, r.flow, drift);
      return r;
    };

    it('reaches out first with the offer instead of a form', () => {
      const open = handleEvent({ type: 'open' }, INITIAL_FLOW, drift);
      expect(open.messages).toHaveLength(1);
      expect(open.messages[0].parts?.map((p) => p.key)).toContain('chat.phq.offer');
      expect(open.messages[0].quickReplies).toEqual(['phq', 'notNow']);
    });

    it('"not now" is respected and falls back to the one-tap moment', () => {
      const r = handleEvent({ type: 'quick', id: 'notNow' }, INITIAL_FLOW, drift);
      expect(r.messages[0].card).toEqual({ type: 'mood' });
      expect(r.effects).toEqual([]);
    });

    it('false alarm: PHQ-2 below 3 stops after two questions, kind reply, no care-team suggestion', () => {
      const r = answer([1, 0]);
      expect(r.effects).toEqual([{ type: 'savePhq', items: [1, 0] }]);
      expect(r.messages[0].parts?.[0].key).toBe('chat.phq.doneLow');
      expect(r.messages.some((m) => m.card?.type === 'consult' || m.card?.type === 'crisis')).toBe(false);
      expect(r.flow.step).toBe('idle');
    });

    it('PHQ-2 of 3 or more continues to the full nine items', () => {
      const two = answer([2, 1]);
      expect(two.effects).toEqual([]);
      expect(two.messages[0].card).toEqual({ type: 'phq', item: 3 });
      const nine = answer([2, 1, 1, 1, 0, 0, 1, 0, 0]);
      expect(nine.effects).toEqual([{ type: 'savePhq', items: [2, 1, 1, 1, 0, 0, 1, 0, 0] }]);
      expect(nine.messages[0].parts?.[0].key).toBe('chat.phq.doneMid');
    });

    it('a total of 10 or more suggests the care team (the person still decides)', () => {
      const r = answer([2, 2, 2, 1, 1, 1, 1, 1, 0]);
      expect(r.messages[0].card).toEqual({ type: 'consult' });
      expect(r.effects).toEqual([{ type: 'savePhq', items: [2, 2, 2, 1, 1, 1, 1, 1, 0] }]);
    });

    it('item 9 above zero always takes the safety path', () => {
      const r = answer([2, 2, 1, 1, 0, 0, 0, 0, 1]);
      expect(r.effects).toEqual([{ type: 'savePhq', items: [2, 2, 1, 1, 0, 0, 0, 0, 1] }, { type: 'raiseAlert' }]);
      expect(r.messages.some((m) => m.card?.type === 'crisis')).toBe(true);
    });
  });

  it('reaches out warmer along the silence ladder, without crisis language', () => {
    const friend = handleEvent({ type: 'open' }, INITIAL_FLOW, { ...ctx, outreach: 'friend' });
    expect(friend.messages[0].parts?.map((p) => p.key)).toContain('chat.outreach.friend');
    expect(friend.messages[0].card).toEqual({ type: 'friend' });
    const lost = handleEvent({ type: 'open' }, INITIAL_FLOW, { ...ctx, outreach: 'reconnect' });
    expect(lost.messages[0].card).toEqual({ type: 'reconnect' });
    expect(lost.messages.some((m) => m.card?.type === 'crisis')).toBe(false);
    expect(lost.effects).toEqual([]);
  });

  it('never cheers on upward drift', () => {
    const r = handleEvent({ type: 'text', text: 'I feel great!' }, INITIAL_FLOW, { ...ctx, upwardDrift: true });
    expect(r.messages[0].parts?.[0].key).toBe('chat.reply.steady');
    const flow = { ...INITIAL_FLOW, step: 'safety' as const, draft: { mood: 5 as const, emotions: [] } };
    const done = handleEvent({ type: 'safety', answer: false }, flow, { ...ctx, upwardDrift: true });
    expect(done.messages[0].parts?.[0].key).toBe('companion.checkin.steady');
  });

  it('rotates calming options', () => {
    const a = handleEvent({ type: 'quick', id: 'relax' }, INITIAL_FLOW, ctx);
    const b = handleEvent({ type: 'quick', id: 'relax' }, a.flow, ctx);
    expect(a.messages[0].card).toEqual({ type: 'intervention', id: 'breathing' });
    expect(b.messages[0].card).toEqual({ type: 'intervention', id: 'fireplace' });
  });
});
