import { Text, type TextProps, type TextStyle } from 'react-native';

import { useTheme } from './theme';
import { typeScale, type TextVariant } from './tokens';

type Tone = 'default' | 'muted' | 'primary' | 'accent' | 'danger' | 'onPrimary' | 'onAccent' | 'onDanger';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: Tone;
  align?: TextStyle['textAlign'];
}

/** All app text goes through here: theme colors, type scale and "Larger text". */
export function AppText({ variant = 'body', tone = 'default', align, style, ...rest }: AppTextProps) {
  const { colors, textScale } = useTheme();
  const t = typeScale[variant];
  const color = {
    default: colors.text,
    muted: colors.textMuted,
    primary: colors.primary,
    accent: colors.accent,
    danger: colors.danger,
    onPrimary: colors.onPrimary,
    onAccent: colors.onAccent,
    onDanger: colors.onDanger,
  }[tone];
  const isHeading = variant === 'display' || variant === 'title' || variant === 'heading';
  return (
    <Text
      accessibilityRole={isHeading ? 'header' : undefined}
      maxFontSizeMultiplier={2}
      {...rest}
      style={[
        {
          color,
          fontSize: t.fontSize * textScale,
          lineHeight: t.lineHeight * textScale,
          fontWeight: t.fontWeight,
          textAlign: align,
        },
        style,
      ]}
    />
  );
}
