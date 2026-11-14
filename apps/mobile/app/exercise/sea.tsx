import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ExerciseShell } from '../../src/features/ExerciseShell';
import { SEA_SOUND } from '../../src/services/sounds';
import { AppText, Button, Illustration, radii, spacing, useScreenFocused, useTheme } from '../../src/ui';

/** Sea sounds: one looping, bundled sound. Starts only when the person presses play. */
export default function SeaScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const focused = useScreenFocused();
  const player = useAudioPlayer(SEA_SOUND);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    player.loop = true;
    player.volume = 0.9;
    // Play even when the phone's ringer is on silent (it was started on purpose).
    void setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, [player]);

  // Never keep playing behind another screen.
  useEffect(() => {
    if (!focused && player.playing) player.pause();
  }, [focused, player]);

  const playing = status.playing;
  return (
    <ExerciseShell id="seaSounds" hint={t('comfort.sea.hint')}>
      <View style={[styles.scene, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Illustration name="waves" category="sky" size={200} />
      </View>
      <Button
        title={t(playing ? 'comfort.sea.pause' : 'comfort.sea.play')}
        variant={playing ? 'secondary' : 'primary'}
        onPress={() => (playing ? player.pause() : player.play())}
      />
      <AppText variant="caption" tone="muted" align="center">
        {t('comfort.sea.soundNote')}
      </AppText>
    </ExerciseShell>
  );
}

const styles = StyleSheet.create({
  scene: { alignItems: 'center', justifyContent: 'center', borderRadius: radii.xl, borderWidth: StyleSheet.hairlineWidth * 2, paddingVertical: spacing.lg },
});
