import type { EmotionId, Scale5 } from '../entities';
import { detectCrisisLanguage } from '../riskRules';
import { matchesAny, normalizeText } from '../text';

/**
 * Very small, transparent intent detection for the simulated companion (en / fi / es / sv).
 * It is NOT a language model: it only routes the user to the right help. Crisis language
 * always wins over everything else.
 */
export type Intent =
  | 'crisis'
  | 'checkin'
  | 'care'
  | 'progress'
  | 'plan'
  | 'relax'
  | 'anxious'
  | 'low'
  | 'tired'
  | 'positive'
  | 'thanks'
  | 'greeting'
  | 'unknown';

const KEYWORDS: [Exclude<Intent, 'crisis' | 'unknown'>, string[]][] = [
  ['checkin', ['check in', 'checkin', 'check-in', 'journal', 'diary', 'log', 'registrar', 'registro', 'diario', 'paivakirja', 'kirjaa*', 'kuulumi*', 'dagbok', 'checka in', 'incheckning']],
  ['care', ['doctor', 'nurse', 'appointment', 'therapist', 'care team', 'consult*', 'medico', 'doctora', 'enfermer*', 'cita', 'terapeuta', 'psiquiatra', 'psicolog*', 'laakari*', 'hoitaja*', 'vastaanotto*', 'hoitotiimi*', 'lakare*', 'sjukskoterska', 'vardteam*', 'psykolog*', 'psykiatri*']],
  ['progress', ['progress', 'trend*', 'how am i doing', 'insight*', 'stats', 'progreso', 'tendencia*', 'como voy', 'kehity*', 'miten menee', 'edisty*', 'framsteg', 'oversikt', 'hur gar det']],
  ['plan', ['plan', 'ideas', 'what should i do', 'today plan', 'que hago', 'ideas para hoy', 'suunnitelma*', 'mita tekisin', 'vad ska jag gora']],
  ['relax', ['relax*', 'calm down', 'breath*', 'breathe', 'meditat*', 'fireplace', 'fish', 'puzzle', 'relaj*', 'respira*', 'calmar*', 'tranquil*', 'rentou*', 'hengit*', 'rauhoit*', 'slappna av', 'andas', 'andning', 'lugna*']],
  ['anxious', ['anxious', 'anxiety', 'nervous', 'panic*', 'worried', 'stress*', 'ansios*', 'ansiedad', 'nervios*', 'preocupad*', 'estres*', 'panico', 'ahdist*', 'jannit*', 'huolestu*', 'paniik*', 'orolig', 'angest*', 'nervos', 'panik*']],
  ['low', ['sad', 'down', 'low', 'depress*', 'hopeless', 'bad', 'awful', 'cry*', 'triste', 'mal', 'deprimid*', 'bajoneado', 'llorar', 'surullin*', 'masentu*', 'huono*', 'alakulo*', 'itke*', 'ledsen', 'nere', 'deppig', 'daligt', 'grat*']],
  ['tired', ['tired', 'exhausted', 'sleep*', 'insomnia', 'cansad*', 'agotad*', 'dormir', 'sueno', 'insomnio', 'vasyny*', 'uupu*', 'uni', 'nukku*', 'unettom*', 'trott', 'utmatt*', 'somn', 'sova']],
  ['positive', ['good', 'great', 'fine', 'happy', 'better', 'well', 'bien', 'feliz', 'mejor', 'genial', 'contento', 'contenta', 'hyva*', 'hyvin', 'iloinen', 'paremmin', 'bra', 'glad', 'battre']],
  ['thanks', ['thanks', 'thank you', 'thx', 'gracias', 'kiitos', 'tack']],
  ['greeting', ['hi', 'hello', 'hey', 'hola', 'buenas', 'moi', 'hei', 'terve', 'hej', 'hallo']],
];

const NEGATIONS = ['not', 'no', 'never', 'nada', 'nunca', 'ei', 'en', 'inte', 'aldrig'];

export function detectIntent(text: string): Intent {
  if (detectCrisisLanguage(text)) return 'crisis';
  for (const [intent, words] of KEYWORDS) {
    if (!matchesAny(text, words)) continue;
    // "not good", "no muy bien", "ei hyvä", "inte bra" → low, not positive
    if (intent === 'positive' && matchesAny(text, NEGATIONS)) return 'low';
    return intent;
  }
  return 'unknown';
}

const EMOTION_WORDS: Record<EmotionId, string[]> = {
  calm: ['calm', 'peaceful', 'tranquil*', 'calma', 'sereno', 'rauhalli*', 'lugn'],
  content: ['content', 'happy', 'ok', 'contento', 'contenta', 'feliz', 'tyytyvai*', 'iloinen', 'nojd', 'glad'],
  grateful: ['grateful', 'thankful', 'agradecid*', 'kiitolli*', 'tacksam'],
  hopeful: ['hope*', 'esperanza', 'esperanzad*', 'toiveikas', 'toivo*', 'hoppfull'],
  proud: ['proud', 'orgullos*', 'ylpea', 'stolt'],
  tired: ['tired', 'exhausted', 'cansad*', 'agotad*', 'vasyny*', 'uupu*', 'trott'],
  sad: ['sad', 'down', 'triste', 'surullin*', 'alakulo*', 'ledsen'],
  anxious: ['anxious', 'nervous', 'worried', 'ansios*', 'nervios*', 'preocupad*', 'ahdist*', 'huolestu*', 'orolig'],
  irritable: ['irritable', 'angry', 'annoyed', 'irritad*', 'enojad*', 'molest*', 'arty*', 'vihai*', 'arg', 'irriterad'],
  lonely: ['lonely', 'alone', 'solo', 'sola', 'soledad', 'yksinai*', 'yksin', 'ensam'],
  overwhelmed: ['overwhelm*', 'abrumad*', 'agobiad*', 'kuormittu*', 'ylikuormi*', 'overvaldig*'],
  numb: ['numb', 'empty', 'vacio', 'vacia', 'tyhja', 'turta', 'tom'],
};

export function detectEmotions(text: string): EmotionId[] {
  return (Object.keys(EMOTION_WORDS) as EmotionId[]).filter((id) => matchesAny(text, EMOTION_WORDS[id]));
}

/** "4", "4/5", "a 2"… → mood 1–5. */
export function parseMood(text: string): Scale5 | null {
  const match = normalizeText(text).match(/\b([1-5])\b/);
  return match ? (Number(match[1]) as Scale5) : null;
}

const YES = ['yes', 'yeah', 'yep', 'si', 'kylla', 'joo', 'ja'];
const NO = ['no', 'nope', 'ei', 'nej'];

export function parseYesNo(text: string): boolean | null {
  if (matchesAny(text, YES)) return true;
  if (matchesAny(text, NO)) return false;
  return null;
}
