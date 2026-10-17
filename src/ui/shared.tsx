import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={styles.screen}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">{children}</ScrollView></SafeAreaView>;
}
export function Notice({ children, busy = false }: PropsWithChildren<{ busy?: boolean }>) {
  return <View style={styles.notice}>{busy && <ActivityIndicator />}<Text accessibilityLiveRegion="polite">{children}</Text></View>;
}
export function Action({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <View style={styles.action}><Button title={title} onPress={onPress} disabled={disabled} /></View>;
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
