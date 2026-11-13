import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { CompanionSpecies } from '../../src/domain/entities';
import { CompanionPicker } from '../../src/features/CompanionPicker';
import { OnboardingFrame } from '../../src/features/OnboardingFrame';
import { useData } from '../../src/store/data';
import { Avatar, spacing } from '../../src/ui';

/** Step 4: choose a companion and give it a name. Creates the fictional patient with 14 days of synthetic history. */
export default function CompanionStep() {
  const { t } = useTranslation();
  const patient = useData((s) => s.patient);
  const createPatient = useData((s) => s.createPatient);
  const updateCompanion = useData((s) => s.updateCompanion);

  const [species, setSpecies] = useState<CompanionSpecies>(patient?.companion.species ?? 'bee');
  const [name, setName] = useState(patient?.companion.name ?? t('onboarding.companion.defaults.bee'));
  const [nameEdited, setNameEdited] = useState(!!patient);
  const [saving, setSaving] = useState(false);

  const onSpecies = (s: CompanionSpecies) => {
    setSpecies(s);
    if (!nameEdited) setName(t(`onboarding.companion.defaults.${s}`));
  };

  const onContinue = async () => {
    setSaving(true);
    const companion = { species, name: name.trim() || t(`onboarding.companion.defaults.${species}`) };
    try {
      if (patient) await updateCompanion(companion);
      else await createPatient(companion);
      router.push('/baseline');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingFrame
      step={4}
      title={t('onboarding.companion.title')}
      subtitle={t('onboarding.companion.subtitle')}
      onContinue={onContinue}
      loading={saving}
    >
      <View style={{ alignItems: 'center', gap: spacing.sm }}>
        <Avatar species={species} size={120} animated accessibilityLabel={t('a11y.companion', { species: t(`species.${species}`), name })} />
      </View>
      <CompanionPicker
        species={species}
        name={name}
        onSpecies={onSpecies}
        onName={(n) => {
          setNameEdited(true);
          setName(n);
        }}
      />
    </OnboardingFrame>
  );
}
