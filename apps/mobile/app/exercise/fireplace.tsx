import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ExerciseShell } from '../../src/features/ExerciseShell';
import { Hearth } from '../../src/features/hearth/Hearth';
import { useScreenFocused, useTheme } from '../../src/ui';

/** Calming fireplace scene (full glow). Static when reduce motion is on; paused when not visible. */
export default function FireplaceScreen() {
  const { t } = useTranslation();
  const { reduceMotion } = useTheme();
  const focused = useScreenFocused();
  return (
    <ExerciseShell id="fireplace" hint={t('comfort.fireplace.hint')}>
      <View style={{ alignItems: 'center' }}>
        <Hearth intensity={1} active={!reduceMotion && focused} accessibilityLabel={t('interventions.fireplace.title')} />
      </View>
    </ExerciseShell>
  );
}
