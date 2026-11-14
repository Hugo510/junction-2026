import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { CompanionSpecies } from '../../src/domain/entities';
import { CompanionPicker } from '../../src/features/CompanionPicker';
import { applyLanguage, SUPPORTED_LANGUAGES } from '../../src/i18n';
import { haptics } from '../../src/services/haptics';
import { useData } from '../../src/store/data';
import { useSettings, type ThemeMode } from '../../src/store/settings';
import { AppText, Avatar, Button, Chip, ChipGroup, Icon, ListItem, Screen, Section, ToggleRow, radii, spacing, useTheme } from '../../src/ui';

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

      <TrustedContactSection />

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
        <ListItem title={t('wearable.menu')} subtitle={t('wearable.menuDesc')} leading={<Icon name="today" color={colors.primary} />} chevron onPress={() => router.push('/wearable')} />
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

/** Someone the person trusts: stays only on this phone, used by the silence ladder for one-tap contact. */
function TrustedContactSection() {
  const { t } = useTranslation();
  const { colors, textScale, font } = useTheme();
  const contact = useSettings((st) => st.trustedContact);
  const setTrustedContact = useSettings((st) => st.setTrustedContact);
  const [name, setName] = useState(contact?.name ?? '');
  const [phone, setPhone] = useState(contact?.phone ?? '');
  const changed = name.trim() !== (contact?.name ?? '') || phone.trim() !== (contact?.phone ?? '');
  const valid = name.trim().length > 0 && /[0-9]{5,}/.test(phone.replace(/\D/g, ''));
  const inputStyle = [styles.input, font('400'), { color: colors.text, borderColor: colors.border, backgroundColor: colors.background, fontSize: 17 * textScale }];

  return (
    <Section title={t('settings.trusted.title')} footer={t('settings.trusted.desc')}>
      <View style={styles.pad}>
        <TextInput
          accessibilityLabel={t('settings.trusted.name')}
          placeholder={t('settings.trusted.name')}
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          maxLength={40}
          style={inputStyle}
        />
        <TextInput
          accessibilityLabel={t('settings.trusted.phone')}
          placeholder={t('settings.trusted.phone')}
          placeholderTextColor={colors.textMuted}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={20}
          style={inputStyle}
        />
        {changed ? (
          <Button size="md" title={t('common.save')} disabled={!valid} onPress={() => setTrustedContact({ name: name.trim(), phone: phone.trim() })} />
        ) : null}
        {contact && !changed ? (
          <Button
            size="md"
            variant="ghost"
            title={t('settings.trusted.remove')}
            onPress={() => {
              setTrustedContact(null);
              setName('');
              setPhone('');
            }}
          />
        ) : null}
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  input: { minHeight: 52, borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing.md },
  pad: { padding: spacing.md, gap: spacing.md },
  padRow: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  about: { flexDirection: 'row', alignItems: 'center' },
});
