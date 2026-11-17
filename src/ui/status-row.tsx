import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Spinner } from 'heroui-native/spinner';

/** Keep the icon beside the first line while long/localized status copy wraps. */
export function StatusRow({ children, busy = false, error = false }: { children: ReactNode; busy?: boolean; error?: boolean }) {
  return <View className="flex-row items-start gap-3" testID="status-row">
    {busy && <View className="shrink-0 pt-0.5"><Spinner size="sm" /></View>}
    <Text accessibilityLiveRegion="polite" className={`min-w-0 flex-1 font-sans text-sm ${error ? 'text-danger' : 'text-muted'}`}>{children}</Text>
  </View>;
}
