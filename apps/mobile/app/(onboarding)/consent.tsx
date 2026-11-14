import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ConsentToggles } from '../../src/features/ConsentToggles';
import { OnboardingFrame } from '../../src/features/OnboardingFrame';
import { Card } from '../../src/ui';

/** Step 3: consent per sensor. All optional. */
export default function ConsentStep() {
  const { t } = useTranslation();
  return (
    <OnboardingFrame
      step={4}
      title={t('onboarding.consent.title')}
      subtitle={t('onboarding.consent.subtitle')}
      onContinue={() => router.push('/companion')}
    >
      <Card>
        <ConsentToggles />
      </Card>
    </OnboardingFrame>
  );
}
