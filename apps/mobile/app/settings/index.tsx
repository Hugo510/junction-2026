import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { CompanionSpecies } from '../../src/domain/entities';
import { CompanionPicker } from '../../src/features/CompanionPicker';
import { applyLanguage, SUPPORTED_LANGUAGES } from '../../src/i18n';
import { haptics } from '../../src/services/haptics';
import { useData } from '../../src/store/data';
import { useSettings, type ThemeMode } from '../../src/store/settings';
import { AppText, Avatar, Button, Card, Chip, ChipGroup, Screen, ToggleRow, spacing } from '../../src/ui';

const THEMES: ThemeMode[] = ['system', 'light', 'dark'];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const s = useSettings();
  const patient = useData((st) => st.patient);
  const updateCompanion = useData((st) => st.updateCompanion);
  const [species, setSpecies] = useState<CompanionSpecies>(patient?.companion.species ?? 'bee');
  const [name, setName] = useState(patient?.companion.name ?? '');
  const companionChanged = !!patient && (species !== patient.companion.species || name.trim() !== patient.companion.name);
  const appName = t('common.appName');

  return (
    <Screen>
      <Card>
        <AppText variant="heading">{t('settings.language')}</AppText>
        <ChipGroup>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <Chip
              key={lang}
              label={t(`languages.${lang}`)}
              selected={s.language === lang}
              onPress={() => {
                s.setLanguage(lang);
                applyLanguage(lang);
              }}
            />
          ))}
        </ChipGroup>
      </Card>

      {patient ? (
        <Card>
          <AppText variant="heading">{t('settings.companion')}</AppText>
          <CompanionPicker species={species} name={name} onSpecies={setSpecies} onName={setName} />
          {companionChanged ? (
            <Button
              title={t('common.save')}
              size="md"
              onPress={() => updateCompanion({ species, name: name.trim() || t(`onboarding.companion.defaults.${species}`) })}
            />
          ) : null}
        </Card>
      ) : null}

      <Card>
        <AppText variant="heading">{t('settings.appearance')}</AppText>
        <ChipGroup>
          {THEMES.map((mode) => (
            <Chip key={mode} label={t(`settings.theme.${mode}`)} selected={s.themeMode === mode} onPress={() => s.setThemeMode(mode)} />
          ))}
        </ChipGroup>
      </Card>

      <Card>
        <AppText variant="heading">{t('settings.accessibility')}</AppText>
        <ToggleRow label={t('settings.largeText')} description={t('settings.largeTextDesc')} value={s.largeText} onChange={s.setLargeText} />
        <ToggleRow label={t('settings.reduceMotion')} description={t('settings.reduceMotionDesc')} value={s.reduceMotion} onChange={s.setReduceMotion} />
        <ToggleRow
          label={t('settings.vibration')}
          description={t('settings.vibrationDesc')}
          value={s.consents.vibration}
          onChange={(v) => s.setConsent('vibration', v)}
        />
      </Card>

      <Button title={t('settings.privacy')} variant="secondary" onPress={() => router.push('/privacy')} />

      <Card tone="sand">
        {/* Hidden demo mode: long-press the logo for 2 seconds. */}
        <Pressable
          accessibilityRole="image"
          accessibilityLabel={t('settings.logo', { app: appName })}
          delayLongPress={2000}
          onLongPress={() => {
            haptics.confirm();
            router.push('/demo');
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
        >
          <Avatar species="bird" size={56} />
          <View style={{ flex: 1 }}>
            <AppText variant="heading">{appName}</AppText>
            <AppText variant="caption" tone="muted">
              {t('settings.version', { version: Constants.expoConfig?.version ?? '0.1.0' })}
            </AppText>
          </View>
        </Pressable>
        <AppText variant="label">{t('settings.about')}</AppText>
        <AppText>{t('settings.aboutBody', { app: appName })}</AppText>
      </Card>
    </Screen>
  );
}
