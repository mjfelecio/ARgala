import { View } from 'react-native';
import { FocusedStatusBar } from './focused-status-bar';
import ArScreen from '@/features/ar/ar-screen';

export function ImmersiveArScreen() {
  return <View className="flex-1 bg-ink">
    <FocusedStatusBar style="light" />
    <ArScreen />
  </View>;
}
