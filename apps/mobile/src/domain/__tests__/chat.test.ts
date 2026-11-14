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
  it('opens with a greeting and an invitation to check in', () => {
    const r = handleEvent({ type: 'open' }, INITIAL_FLOW, ctx);
    expect(r.messages[0].parts?.[0].key).toBe('companion.greeting.morning');
    expect(r.messages[1].quickReplies).toContain('checkin');
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

  it('suggests (never creates) a consultation when priority is high', () => {
    const r = handleEvent({ type: 'open' }, INITIAL_FLOW, { ...ctx, priorityLevel: 'high' });
    expect(r.messages.some((m) => m.card?.type === 'consult')).toBe(true);
    expect(r.effects).toEqual([]);
  });

  it('rotates calming options', () => {
    const a = handleEvent({ type: 'quick', id: 'relax' }, INITIAL_FLOW, ctx);
    const b = handleEvent({ type: 'quick', id: 'relax' }, a.flow, ctx);
    expect(a.messages[0].card).toEqual({ type: 'intervention', id: 'breathing' });
    expect(b.messages[0].card).toEqual({ type: 'intervention', id: 'fireplace' });
  });
});
