import { Stack } from 'expo-router';

// Direct links retain the catalog below a detail page, including Android Back.
export const unstable_settings = { anchor: 'index' };

export default function DestinationsLayout() {
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="index" />
    <Stack.Screen name="[destinationId]" />
  </Stack>;
}
