import { JournalProvider } from '@/features/journal/provider';
import { DestinationContentProvider } from '@/features/destination-content/provider';
import { ArrivalReminderProvider } from '@/features/arrival-reminders/provider';
import { setFeaturedSelection } from '@/features/destinations/map-selection';
import { useQueryClient } from '@tanstack/react-query';
import { DestinationArAdmissionProvider } from '@/features/destination-ar/admission-provider';
import { Stack, router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useResolveClassNames } from 'uniwind';
import { useThemeColor } from 'heroui-native/hooks';

// Preserve an underlying map/tab navigator when Settings is opened directly.
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function AppLayout() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const headerStyle = useResolveClassNames('bg-page-mint');
  const headerTitleStyle = useResolveClassNames('font-sans text-card font-semibold text-foreground');
  const headerTintColor = useThemeColor('accent');
  return <JournalProvider><DestinationContentProvider><ArrivalReminderProvider onOpenDestination={id => {
    setFeaturedSelection(queryClient, id); router.navigate({ pathname: '/', params: { featuredDestinationId: id } });
  }}><DestinationArAdmissionProvider><Stack screenOptions={{ headerStyle, headerTitleStyle, headerTintColor, headerShadowVisible: false }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="place/[providerId]" options={{ headerShown: false }} />
    <Stack.Screen name="destination-ar/[destinationId]" options={{ headerShown: false }} />
    <Stack.Screen name="saved-places" options={{ headerShown: false }} />
    <Stack.Screen name="directions" options={{ headerShown: false }} />
    <Stack.Screen name="destinations" options={{ headerShown: false }} />
    <Stack.Screen name="settings" options={{ title: t('settings.title'), headerShown: false }} />
    <Stack.Screen name="viro-ring" options={{ headerShown: false }} />
    <Stack.Screen name="viro-spike" options={{ headerShown: false }} />
  </Stack></DestinationArAdmissionProvider></ArrivalReminderProvider></DestinationContentProvider></JournalProvider>;
}
