import '../../global.css';
import { StatusBar } from 'expo-status-bar';
import { Uniwind, withUniwind } from 'uniwind';
import { HeroUINativeProvider } from 'heroui-native/provider';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '@/i18n';
import { DevelopmentShowcase } from '@/features/ui-showcase/showcase-gate';
import { useTranslation } from 'react-i18next';
import { SettingsProvider } from '@/features/settings/provider';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { environment } from '@/config/env';
import { AuthProvider } from '@/features/auth/provider';
import { queryClient } from '@/lib/query';
import { Notice, Screen } from '@/ui/shared';

import { OnboardingProvider } from '@/features/onboarding/provider';
import RootNavigation from '@/features/navigation/root-navigation';

// Only the approved light Clean Explorer theme ships in this phase.
Uniwind.setTheme('light');
const StyledGestureHandlerRootView = withUniwind(GestureHandlerRootView);

export default function RootLayout() {
  const { t } = useTranslation();
  return <StyledGestureHandlerRootView className="flex-1">
    <StatusBar style="dark" hidden={false} />
    <SafeAreaProvider>
      <HeroUINativeProvider>
        <DevelopmentShowcase>
          <SettingsProvider>
            {environment.success
              ? <QueryClientProvider client={queryClient}><AuthProvider><OnboardingProvider><RootNavigation /></OnboardingProvider></AuthProvider></QueryClientProvider>
              : <Screen><Notice>{t('auth.setup')}</Notice></Screen>}
          </SettingsProvider>
        </DevelopmentShowcase>
      </HeroUINativeProvider>
    </SafeAreaProvider>
  </StyledGestureHandlerRootView>;
}
