import { CameraView, useCameraPermissions } from 'expo-camera';
import { useFocusEffect, useIsFocused } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/features/settings/provider';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { LocationStatus, SystemSettingsAction } from '@/features/location/status';
import { useAppActive } from '@/lib/use-app-active';
import { Action, Notice, Screen } from '@/ui/shared';

export default function ArScreen() {
  const { t } = useTranslation();
  const { activationRadiusMeters } = useSettings();
  const [permission, requestPermission, getPermission] = useCameraPermissions();
  const [error, setError] = useState<string | null>(null);
  const active = useAppActive(); const focused = useIsFocused();
  const location = useDeviceLocation({ heading: true });
  const checkPermission = useCallback(async () => {
    try { await getPermission(); setError(null); }
    catch { setError('camera.permissionCheckFailed'); }
  }, [getPermission]);
  useFocusEffect(useCallback(() => {
    if (active) void checkPermission();
  }, [active, checkPermission]));
  async function allowCamera() {
    try { await requestPermission(); setError(null); }
    catch { setError('camera.permissionRequestFailed'); }
  }
  if (!permission) return <Screen>{error ? <><Notice>{t(error)}</Notice><Action title={t('common.retry')} onPress={() => void checkPermission()} /></> : <Notice busy>{t('camera.checking')}</Notice>}</Screen>;
  if (!permission.granted) return <Screen><Notice>{t('camera.permission')}</Notice>{permission.canAskAgain ? <Action title={t('camera.allow')} onPress={() => void allowCamera()} /> : <SystemSettingsAction />}{error && <Notice>{t(error)}</Notice>}</Screen>;
  return <View style={local.container}>
    {focused && active && !error && <CameraView style={StyleSheet.absoluteFill} facing="back" onMountError={() => setError('camera.mountFailed')} />}
    <View style={local.status}>
      {error && <><Notice>{t(error)}</Notice><Action title={t('camera.retry')} onPress={() => { if (error === 'camera.permissionCheckFailed') void checkPermission(); else setError(null); }} /></>}
      <LocationStatus location={location} />
      <Notice>{t(location.headingStatus === 'ready' ? 'camera.ready' : location.headingStatus === 'pending' ? 'camera.pending' : 'camera.headingUnavailable')}</Notice>
      {__DEV__ && <Notice><Text selectable>{JSON.stringify({ position: location.position, accuracyMeters: location.accuracy, heading: location.heading, activationRadiusMeters: activationRadiusMeters }, null, 2)}</Text></Notice>}
    </View>
  </View>;
}
const local = StyleSheet.create({ container: { flex: 1, backgroundColor: '#111' }, status: { padding: 16, gap: 8 } });
