import type { PropsWithChildren } from 'react';
import { Button } from 'heroui-native/button';
import { Spinner } from 'heroui-native/spinner';
import { Surface } from 'heroui-native/surface';
import { ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';

const StyledSafeAreaView = withUniwind(SafeAreaView);
export function Screen({ children }: PropsWithChildren) {
  return <StyledSafeAreaView className="flex-1 bg-page-mint">
    <ScrollView className="flex-1" contentContainerClassName="grow gap-4 p-5" keyboardShouldPersistTaps="handled">{children}</ScrollView>
  </StyledSafeAreaView>;
}
export function Notice({ children, busy = false }: PropsWithChildren<{ busy?: boolean }>) {
  return <Surface variant="secondary" className="rounded-card p-4">
    <View className="flex-row items-start gap-3">
      {busy && <Spinner size="sm" />}
      <Text accessibilityLiveRegion="polite" className="shrink grow font-sans text-sm text-foreground">{children}</Text>
    </View>
  </Surface>;
}
export function Action({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Button variant="primary" className="w-full" accessibilityLabel={title} accessibilityState={{ disabled }} isDisabled={disabled} onPress={onPress}>
    <Button.Label className="shrink text-center">{title}</Button.Label>
  </Button>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View><Text>{label}</Text><TextInput accessibilityLabel={label} style={styles.field} {...props} /></View>;
}
export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 16, flexGrow: 1 },
  notice: { padding: 16, gap: 8, backgroundColor: '#eef3f7', borderRadius: 8 },
  action: { marginVertical: 4 },
  field: { borderWidth: 1, borderColor: '#667788', borderRadius: 6, padding: 12, marginTop: 6, color: '#172838' },
  title: { fontSize: 24, fontWeight: '600', color: '#172838' },
});
