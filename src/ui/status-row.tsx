import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Spinner } from 'heroui-native/spinner';

/** Keep the icon beside the first line while long/localized status copy wraps. */
export function StatusRow({ children, busy = false, error = false, centered = false }: { children: ReactNode; busy?: boolean; error?: boolean; centered?: boolean }) {
  return <View className={`flex-row gap-3 ${centered ? 'items-center justify-center' : 'items-start'}`} testID="status-row">
    {busy && <View className={centered ? 'shrink-0' : 'shrink-0 pt-0.5'}><Spinner size="sm" /></View>}
    <Text accessibilityLiveRegion="polite" className={`min-w-0 font-sans text-sm ${centered ? 'shrink text-center' : 'flex-1'} ${error ? 'text-danger' : 'text-muted'}`}>{children}</Text>
  </View>;
}
