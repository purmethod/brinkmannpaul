import type { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors, fonts, space, type } from '@/theme';

type Variant = keyof typeof type;

export function Txt({
  variant = 'body',
  muted,
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; muted?: boolean; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[type[variant], { color: color ?? (muted ? colors.textSecondary : colors.text) }, style]}
    />
  );
}

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, styles.fill, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  tone,
  disabled,
  accessibilityHint,
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'text';
  tone?: 'danger';
  disabled?: boolean;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        kind === 'primary' && styles.primary,
        kind === 'secondary' && styles.secondary,
        kind === 'text' && styles.textButton,
        (pressed || disabled) && { opacity: disabled ? 0.4 : 0.75 },
        style,
      ]}
    >
      <Text
        maxFontSizeMultiplier={1.4}
        style={[
          styles.buttonLabel,
          { color: kind === 'primary' ? colors.background : tone === 'danger' ? colors.accent : colors.text },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

export function SectionLabel({ children }: { children: string }) {
  return (
    <Txt variant="label" muted accessibilityRole="header" style={styles.sectionLabel}>
      {children.toUpperCase()}
    </Txt>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  // Phone-first; on tablets and the web preview the column stays readable.
  content: {
    paddingHorizontal: space.l,
    paddingBottom: space.xxl,
    paddingTop: space.m,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  fill: { flex: 1 },
  button: {
    minHeight: 54,
    borderRadius: 14,
    paddingHorizontal: space.l,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surface },
  textButton: { backgroundColor: 'transparent', minHeight: 44 },
  buttonLabel: { fontFamily: fonts.semibold, fontSize: 16, letterSpacing: 0.1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline },
  sectionLabel: { marginTop: space.xl, marginBottom: space.s },
});
