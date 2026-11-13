import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { ReactionAggregate } from '../domain/entities';
import { haptics } from '../services/haptics';
import { ReactionSession } from '../services/sensors/reaction';
import { AppText, Button, spacing, useTheme } from '../ui';

const ROUNDS = 8;

type Phase = 'intro' | 'waiting' | 'glow' | 'feedback' | 'done';

/** "Tap when the circle glows". Only the aggregate (mean, variability, accuracy) is returned. */
export function ReactionGame({ onDone, onSkip }: { onDone: (r: ReactionAggregate) => void; onSkip: () => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const session = useRef(new ReactionSession(ROUNDS));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhase] = useState<Phase>('intro');
  const [message, setMessage] = useState('');
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<ReactionAggregate | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const nextRound = () => {
    setPhase('waiting');
    setMessage(t('checkin.game.wait'));
    timer.current = setTimeout(() => {
      session.current.markGlow();
      setPhase('glow');
      setMessage(t('checkin.game.tap'));
    }, 900 + Math.random() * 1500);
  };

  const onCircle = () => {
    if (phase !== 'waiting' && phase !== 'glow') return;
    if (timer.current) clearTimeout(timer.current);
    const ms = session.current.tap();
    haptics.tap();
    setRound(session.current.round);
    setMessage(ms === null ? t('checkin.game.tooEarly') : t('checkin.game.nice'));
    setPhase('feedback');
    if (session.current.finished) {
      const summary = session.current.summary();
      setResult(summary);
      timer.current = setTimeout(() => setPhase('done'), 600);
    } else {
      timer.current = setTimeout(nextRound, 700);
    }
  };

  if (phase === 'intro') {
    return (
      <View style={styles.wrap}>
        <AppText variant="title">{t('checkin.game.title')}</AppText>
        <AppText tone="muted">{t('checkin.game.intro', { rounds: ROUNDS })}</AppText>
        <Button title={t('common.start')} onPress={nextRound} />
        <Button title={t('checkin.game.skip')} variant="ghost" onPress={onSkip} />
      </View>
    );
  }

  if (phase === 'done' && result) {
    return (
      <View style={styles.wrap}>
        <AppText variant="title">{t('checkin.game.title')}</AppText>
        <AppText accessibilityLiveRegion="polite">{t('checkin.game.result', { ms: result.meanMs })}</AppText>
        <Button title={t('common.continue')} onPress={() => onDone(result)} />
      </View>
    );
  }

  const glowing = phase === 'glow';
  return (
    <View style={styles.wrap}>
      <AppText variant="label" tone="muted" align="center">
        {t('checkin.game.round', { current: Math.min(round + 1, ROUNDS), total: ROUNDS })}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('checkin.game.circle')}
        accessibilityHint={message}
        onPress={onCircle}
        style={[
          styles.circle,
          {
            backgroundColor: glowing ? colors.primary : colors.surfaceAlt,
            borderColor: glowing ? colors.primary : colors.border,
            shadowColor: colors.primary,
            shadowOpacity: glowing ? 0.6 : 0,
          },
        ]}
      />
      <AppText variant="heading" align="center" accessibilityLiveRegion="assertive">
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  circle: {
    alignSelf: 'center',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    marginVertical: spacing.lg,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
});
