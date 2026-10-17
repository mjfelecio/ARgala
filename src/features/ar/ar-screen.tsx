import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ACTIVATION } from '@/config/limits';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { LocationStatus, SystemSettingsAction } from '@/features/location/status';
import { useAppActive } from '@/lib/use-app-active';
import { Action, Notice, Screen } from '@/ui/shared';

export default function ArScreen() {
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const active = useAppActive(); const focused = useIsFocused();
  const location = useDeviceLocation({ heading: true });
  useEffect(() => {
    let alive = true;
    void CameraView.isAvailableAsync().then((value) => { if (alive) setAvailable(value); }).catch(() => { if (alive) setAvailable(false); });
    return () => { alive = false; };
  }, []);
  useFocusEffect(useCallback(() => {
    if (active) void getPermission().catch(() => setError('Unable to check camera permission.'));
  }, [active, getPermission]));
  async function allowCamera() {
    try { await requestPermission(); setError(null); }
    catch { setError('Unable to request camera permission.'); }
  }
  if (!permission || available === null) return <Screen><Notice busy>Checking camera…</Notice></Screen>;
  if (!available) return <Screen><Notice>A camera preview is unavailable on this device.</Notice><LocationStatus location={location} /></Screen>;
  if (!permission.granted) return <Screen><Notice>Allow camera access to open the AR preview.</Notice>{permission.canAskAgain ? <Action title="Allow camera" onPress={() => void allowCamera()} /> : <SystemSettingsAction />}{error && <Notice>{error}</Notice>}</Screen>;
  return <View style={local.container}>
    {focused && active && !error && <CameraView style={StyleSheet.absoluteFill} facing="back" onMountError={() => setError('The camera could not start. Close other camera apps and retry.')} />}
    <View style={local.status}>
      {error && <><Notice>{error}</Notice><Action title="Retry camera" onPress={() => setError(null)} /></>}
      <LocationStatus location={location} />
      <Notice>{location.headingStatus === 'ready' ? 'Compass ready. Camera preview foundation.' : location.headingStatus === 'pending' ? 'Waiting for the compass…' : 'Compass unavailable or uncalibrated. Camera preview remains available.'}</Notice>
      {__DEV__ && <Notice><Text selectable>{JSON.stringify({ position: location.position, accuracyMeters: location.accuracy, heading: location.heading, activationRadiusMeters: ACTIVATION.defaultMeters }, null, 2)}</Text></Notice>}
    </View>
  </View>;
}
const local = StyleSheet.create({ container: { flex: 1, backgroundColor: '#111' }, status: { padding: 16, gap: 8 } });
