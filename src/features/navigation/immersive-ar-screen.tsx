import { SafeAreaView } from 'react-native-safe-area-context';
import { withUniwind } from 'uniwind';
import { FocusedStatusBar } from './focused-status-bar';
import ArScreen from '@/features/ar/ar-screen';

const StyledSafeAreaView = withUniwind(SafeAreaView);

export function ImmersiveArScreen() {
  return <StyledSafeAreaView className="flex-1 bg-ink" edges={['top', 'left', 'right', 'bottom']}>
    <FocusedStatusBar style="light" />
    <ArScreen />
  </StyledSafeAreaView>;
}
