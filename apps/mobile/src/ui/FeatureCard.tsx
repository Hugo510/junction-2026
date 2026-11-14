import { Pressable, StyleSheet, View } from 'react-native';

import { haptics } from '../services/haptics';
import { AppText } from './AppText';
import { Illustration, type IllustrationName } from './Illustration';
import { useTheme } from './theme';
import { radii, spacing, type Category } from './tokens';

export interface FeatureCardProps {
  title: string;
  description?: string;
  /** Small line above the title, e.g. "3 min". */
  eyebrow?: string;
  category: Category;
  art: IllustrationName;
  /** Without onPress the card is a banner (screen header), not a button. */
  onPress?: () => void;
  /** "lg" for screen banners, "md" for lists, "sm" for narrow places (side menu). */
  size?: 'lg' | 'md' | 'sm';
  accessibilityHint?: string;
}

const ART = { lg: 104, md: 84, sm: 60 } as const;

/**
 * Hub card: text on the left, a soft illustration on the right, one colour per area.
 * The whole card is one button (title + description are read together).
 */
export function FeatureCard({ title, description, eyebrow, category, art, onPress, size = 'md', accessibilityHint }: FeatureCardProps) {
  const { colors } = useTheme();
  const tint = colors.categories[category];
  const artSize = ART[size];
  const pad = size === 'sm' ? spacing.sm + spacing.xs : spacing.md;
  const base = [styles.card, { backgroundColor: tint.bg, minHeight: artSize + pad * 2, paddingVertical: pad, borderRadius: size === 'sm' ? radii.lg : radii.xl }];

  const content = (
    <>
      <View style={styles.texts}>
        {eyebrow ? (
          <AppText variant="caption" tone="muted" style={styles.eyebrow}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant={size === 'lg' ? 'title' : size === 'sm' ? 'label' : 'heading'} accessibilityRole={onPress ? 'text' : 'header'}>
          {title}
        </AppText>
        {description ? (
          <AppText variant="caption" tone="muted" numberOfLines={size === 'lg' ? 5 : 3}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Illustration name={art} category={category} size={artSize} />
    </>
  );

  if (!onPress) return <View style={base}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[eyebrow, title, description].filter(Boolean).join('. ')}
      accessibilityHint={accessibilityHint}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [base, { opacity: pressed ? 0.92 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] }]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingLeft: spacing.md + spacing.xs,
    paddingRight: spacing.md,
    overflow: 'hidden',
  },
  texts: { flex: 1, gap: spacing.xs },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 0.6, fontSize: 12, lineHeight: 16 },
});
