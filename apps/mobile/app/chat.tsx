import { Redirect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { ActionSheet } from '../src/features/chat/ActionSheet';
import { Composer, QuickReplies, TypingIndicator } from '../src/features/chat/Composer';
import { MessageItem } from '../src/features/chat/MessageItem';
import { SideMenu } from '../src/features/chat/SideMenu';
import { useChatViewModel, type ChatRow } from '../src/features/chat/useChatViewModel';
import { Hearth } from '../src/features/hearth/Hearth';
import { useEmbers } from '../src/features/hearth/useEmbers';
import { capitalizeFirst, formatDate } from '../src/i18n';
import { useData } from '../src/store/data';
import { AppText, Avatar, HelpButton, Icon, MAX_FONT_SCALE, MIN_TOUCH, spacing, useScreenFocused, useTheme } from '../src/ui';

/** Home screen: talk to your companion. Everything else opens from here (cards, + sheet, ☰ menu). */
export default function ChatScreen() {
  const { t } = useTranslation();
  const { colors, reduceMotion } = useTheme();
  const patient = useData((s) => s.patient);
  const vm = useChatViewModel();
  const embers = useEmbers();
  const focused = useScreenFocused();
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const name = patient?.companion.name ?? '';
  const species = patient?.companion.species ?? 'person';

  const dayLabel = useCallback(
    (iso: string) => {
      const diff = Math.round((new Date(`${vm.today}T12:00:00`).getTime() - new Date(`${iso}T12:00:00`).getTime()) / 86_400_000);
      if (diff === 0) return t('common.today');
      if (diff === 1) return t('common.yesterday');
      return capitalizeFirst(formatDate(new Date(`${iso}T12:00:00`), 'EEEE d MMMM'));
    },
    [vm.today, t],
  );

  const renderItem = useCallback(
    ({ item }: { item: ChatRow }) =>
      item.kind === 'day' ? (
        <AppText variant="caption" tone="muted" align="center" style={styles.day}>
          {dayLabel(item.date)}
        </AppText>
      ) : (
        <MessageItem
          message={item.message}
          species={species}
          showAvatar={item.showAvatar}
          cardActive={item.message.id === vm.activeCardId && !vm.typing}
          draftMood={vm.draftMood}
          handlers={vm.handlers}
        />
      ),
    [dayLabel, species, vm.activeCardId, vm.typing, vm.draftMood, vm.handlers],
  );

  if (!patient) return <Redirect href="/start" />;

  const showDisclaimer = () => Alert.alert(name, t('chat.disclaimer', { name }));

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('chat.menu')} onPress={() => setMenuOpen(true)} style={styles.iconButton}>
          <Icon name="menu" color={colors.text} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('a11y.companion', { species: t(`species.${species}`), name })}
          accessibilityHint={t('chat.aboutHint')}
          onPress={showDisclaimer}
          style={styles.title}
        >
          <Avatar species={species} size={32} />
          <AppText variant="heading" numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE.dense} style={styles.flexShrink}>
            {name}
          </AppText>
          <Icon name="info" color={colors.textMuted} size={16} />
        </Pressable>
        <HelpButton />
      </View>

      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          inverted
          data={vm.rows}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={14}
          maxToRenderPerBatch={10}
          windowSize={9}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={vm.typing ? <TypingIndicator name={name} /> : undefined}
          ListFooterComponent={
            <View style={styles.hero}>
              <Hearth
                intensity={embers.level}
                active={focused && !reduceMotion}
                scale={0.62}
                accessibilityLabel={`${t('embers.label', { state: t(`embers.state.${embers.state}`) })}. ${t('embers.hint')}`}
              />
              <AppText variant="caption" tone="muted" align="center">
                {t('embers.label', { state: t(`embers.state.${embers.state}`) })} · {t('embers.hint')}
              </AppText>
              <View style={styles.heroName}>
                <Avatar species={species} size={32} />
                <AppText variant="title">{name}</AppText>
              </View>
              <AppText variant="caption" tone="muted" align="center">
                {t('chat.heroSubtitle')}
              </AppText>
              <AppText variant="caption" tone="muted" align="center">
                {t('chat.disclaimer', { name })}
              </AppText>
            </View>
          }
        />

        <QuickReplies ids={vm.quickReplies} onPick={vm.sendQuick} />
        <View style={styles.composerWrap}>
          <Composer name={name} disabled={vm.typing} onSend={vm.sendText} onPlus={() => setActionsOpen(true)} />
        </View>
      </KeyboardAvoidingView>

      <SideMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
      <ActionSheet visible={actionsOpen} onClose={() => setActionsOpen(false)} onQuick={vm.sendQuick} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fill: { flex: 1 },
  flexShrink: { flexShrink: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xs, minHeight: 56, gap: spacing.xs },
  iconButton: { width: MIN_TOUCH, height: MIN_TOUCH, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: MIN_TOUCH },
  list: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, gap: spacing.md },
  hero: { alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg },
  day: { marginVertical: spacing.xs },
  heroName: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  composerWrap: { paddingBottom: spacing.sm, paddingTop: spacing.xs },
});
