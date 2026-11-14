import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useSettings, type Consents } from '../store/settings';
import { ToggleRow, spacing } from '../ui';

/** 4 sensors + permission for the care team to reach out after a long silence. */
const ORDER: (keyof Consents)[] = ['movement', 'taps', 'location', 'vibration', 'careTeamAfterSilence'];

/** Per-sensor consent toggles, shared by onboarding and the privacy center. */
export function ConsentToggles() {
  const { t } = useTranslation();
  const consents = useSettings((s) => s.consents);
  const setConsent = useSettings((s) => s.setConsent);
  return (
    <View style={{ gap: spacing.sm }}>
      {ORDER.map((key) => (
        <ToggleRow
          key={key}
          label={t(`onboarding.consent.${key}`)}
          description={t(`onboarding.consent.${key}Desc`)}
          value={consents[key]}
          onChange={(v) => setConsent(key, v)}
        />
      ))}
    </View>
  );
}
