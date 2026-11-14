import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { CompanionSpecies } from '../../src/domain/entities';
import { CompanionPicker } from '../../src/features/CompanionPicker';
import { applyLanguage, SUPPORTED_LANGUAGES } from '../../src/i18n';
import { haptics } from '../../src/services/haptics';
import { useData } from '../../src/store/data';
import { useSettings, type ThemeMode } from '../../src/store/settings';
import { AppText, Avatar, Button, Chip, ChipGroup, Icon, ListItem, Screen, Section, ToggleRow, spacing, useTheme } from '../../src/ui';

const THEMES: ThemeMode[] = ['system', 'light', 'dark'];

/** Settings as grouped lists (no nested cards). */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const s = useSettings();
  const patient = useData((st) => st.patient);
  const updateCompanion = useData((st) => st.updateCompanion);
  const [species, setSpecies] = useState<CompanionSpecies>(patient?.companion.species ?? 'bee');
  const [name, setName] = useState(patient?.companion.name ?? '');
  const companionChanged = !!patient && (species !== patient.companion.species || name.trim() !== patient.companion.name);
  const appName = t('common.appName');

  return (
    <Screen>
      <Section title={t('settings.language')}>
        <View style={styles.pad}>
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
        </View>
      </Section>

      {patient ? (
        <Section title={t('settings.companion')}>
          <View style={styles.pad}>
            <CompanionPicker species={species} name={name} onSpecies={setSpecies} onName={setName} />
            {companionChanged ? (
              <Button
                title={t('common.save')}
                size="md"
                onPress={() => updateCompanion({ species, name: name.trim() || t(`onboarding.companion.defaults.${species}`) })}
              />
            ) : null}
          </View>
        </Section>
      ) : null}

      <Section title={t('settings.appearance')}>
        <View style={styles.pad}>
          <ChipGroup>
            {THEMES.map((mode) => (
              <Chip key={mode} label={t(`settings.theme.${mode}`)} selected={s.themeMode === mode} onPress={() => s.setThemeMode(mode)} />
            ))}
          </ChipGroup>
        </View>
      </Section>

      <Section title={t('settings.accessibility')}>
        <View style={styles.padRow}>
          <ToggleRow label={t('settings.largeText')} description={t('settings.largeTextDesc')} value={s.largeText} onChange={s.setLargeText} />
        </View>
        <View style={styles.padRow}>
          <ToggleRow label={t('settings.reduceMotion')} description={t('settings.reduceMotionDesc')} value={s.reduceMotion} onChange={s.setReduceMotion} />
        </View>
        <View style={styles.padRow}>
          <ToggleRow label={t('settings.vibration')} description={t('settings.vibrationDesc')} value={s.consents.vibration} onChange={(v) => s.setConsent('vibration', v)} />
        </View>
      </Section>

      <Section>
        <ListItem
          title={t('settings.privacy')}
          leading={<Icon name="shield" color={colors.primary} />}
          chevron
          onPress={() => router.push('/privacy')}
        />
      </Section>

      <Section title={t('settings.about')} footer={t('settings.aboutBody', { app: appName })}>
        {/* Hidden demo mode: long-press the logo for 2 seconds. */}
        <Pressable
          accessibilityRole="image"
          accessibilityLabel={t('settings.logo', { app: appName })}
          delayLongPress={2000}
          onLongPress={() => {
            haptics.confirm();
            router.push('/demo');
          }}
          style={[styles.pad, styles.about]}
        >
          <Avatar species="bird" size={48} />
          <View style={{ flex: 1 }}>
            <AppText variant="heading">{appName}</AppText>
            <AppText variant="caption" tone="muted">
              {t('settings.version', { version: Constants.expoConfig?.version ?? '0.1.0' })}
            </AppText>
          </View>
        </Pressable>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: spacing.md, gap: spacing.md },
  padRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  about: { flexDirection: 'row', alignItems: 'center' },
});
