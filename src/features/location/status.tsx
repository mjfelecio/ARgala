import { Alert, Linking } from 'react-native';
import { Action, Notice } from '@/ui/shared';
import type { useDeviceLocation } from './use-device-location';
export function SystemSettingsAction() {
  return <Action title="Open device settings" onPress={() => { void Linking.openSettings().catch(() => Alert.alert('Unable to open settings. Please open them from Android settings.')); }} />;
}
export function LocationStatus({ location }: { location: ReturnType<typeof useDeviceLocation> }) {
  if (location.status === 'ready') return null;
  return <>
    <Notice busy={location.status === 'loading'}>{location.status === 'loading' ? 'Finding your location…' : location.status === 'denied' ? 'Location permission is required to discover nearby places.' : location.status === 'disabled' ? 'Enable device location services, then retry.' : location.error ?? 'Location is unavailable.'}</Notice>
    {location.status !== 'loading' && <Action title="Retry location" onPress={location.retry} />}
    {(location.status === 'denied' || location.status === 'disabled') && <SystemSettingsAction />}
  </>;
}
