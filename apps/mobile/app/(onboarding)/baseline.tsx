import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CheckInFlow, type CheckInResult } from '../../src/features/CheckInFlow';
import { OnboardingFrame } from '../../src/features/OnboardingFrame';
import { useSettings } from '../../src/store/settings';

/** Step 5: short baseline check-in, then into the app. */
export default function BaselineStep() {
  const { t } = useTranslation();
  const setOnboarded = useSettings((s) => s.setOnboarded);

  const onSubmitted = ({ risk }: CheckInResult) => {
    setOnboarded(true);
    router.replace('/chat');
    if (risk.level === 'urgent') router.push({ pathname: '/crisis', params: { urgent: '1' } });
  };

  return (
    <OnboardingFrame step={6} title={t('onboarding.baseline.title')} subtitle={t('onboarding.baseline.subtitle')}>
      <CheckInFlow variant="baseline" onSubmitted={onSubmitted} />
    </OnboardingFrame>
  );
}
