import type { ReactElement } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type ViewProps } from 'react-native';
import { colors, radii, space, targets, typeScale } from './theme';

type ActionProps = { label: string; onPress(): void; disabled?: boolean; accessibilityLabel?: string };
export function PillAction({ label, onPress, variant = 'primary', disabled = false, busy = false, accessibilityLabel }: ActionProps & { variant?: 'primary' | 'secondary' | 'outline'; busy?: boolean }) {
  const blocked = disabled || busy;
  const ink = variant === 'primary' ? colors.surface : colors.brandStrong;
  return <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label}
    accessibilityState={{ disabled: blocked, busy }} disabled={blocked} onPress={blocked ? undefined : onPress}
    style={({ pressed }) => [styles.pill, variants[variant], pressed && styles.pressed, blocked && styles.disabled]}>
    {busy && <ActivityIndicator color={ink} />}<Text style={[styles.label, { color: ink }]}>{label}</Text>
  </Pressable>;
}
export function CircleAction({ label, onPress, icon, disabled = false }: ActionProps & { icon: ReactElement }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled}
    onPress={disabled ? undefined : onPress} style={({ pressed }) => [styles.circle, pressed && styles.pressed, disabled && styles.disabled]}>
    <View accessible={false} importantForAccessibility="no-hide-descendants">{icon}</View>
  </Pressable>;
}
export function FloatingSurface({ style, ...props }: ViewProps) {
  return <View {...props} style={[styles.surface, style]} />;
}
const variants = StyleSheet.create({
  primary: { backgroundColor: colors.brandPrimary },
  secondary: { backgroundColor: colors.mint },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
});
const styles = StyleSheet.create({
  pill: { minHeight: targets.prominent, minWidth: targets.minimum, paddingHorizontal: space.xl, paddingVertical: space.md, borderRadius: radii.pill, flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'center', alignItems: 'center' },
  label: { ...typeScale.action, textAlign: 'center', flexShrink: 1 },
  circle: { minHeight: targets.minimum, minWidth: targets.minimum, borderRadius: radii.pill, backgroundColor: colors.surface, padding: space.md, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  pressed: { opacity: 0.75 }, disabled: { opacity: 0.5 },
  surface: { backgroundColor: colors.surface, borderRadius: radii.card, elevation: 4, shadowColor: colors.text, shadowOpacity: 0.1, shadowRadius: space.md, shadowOffset: { width: 0, height: space.xs } },
});
