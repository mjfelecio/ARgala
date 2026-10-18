import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSettings } from '@/features/settings/provider';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { SystemSettingsAction } from '@/features/location/status';
import { useAppActive } from '@/lib/use-app-active';
import { Action, Notice } from '@/ui/shared';

import { ArDiscovery } from './ar-discovery';

export default function ArScreen() {
  const { t } = useTranslation();
  const { activationRadiusMeters } = useSettings();
  const [permission, requestPermission, getPermission] = useCameraPermissions({ get: false });
  const [error, setError] = useState<string | null>(null);
  const active = useAppActive(); const focused = useIsFocused();
  const location = useDeviceLocation({ heading: true, distanceIntervalMeters: 0 });
  const diagnostics = typeof __DEV__ !== 'undefined' && __DEV__ ? <Notice><Text selectable>{JSON.stringify({
    sensorDebug: 3, feature: 'camera', active, focused, permissionGranted: permission?.granted ?? null, error,
    hasPosition: Boolean(location.position), headingStatus: location.headingStatus, activationRadiusMeters,
  })}</Text></Notice> : null;
  const checkPermission = useCallback(async () => {
    try { await getPermission(); setError(null); }
    catch { setError('camera.permissionCheckFailed'); }
  }, [getPermission]);
  useEffect(() => {
    if (!active || !focused) return;
    let alive = true;
    void Promise.resolve().then(() => alive ? getPermission() : null).then(
      () => { if (alive) setError(null); },
      () => { if (alive) setError('camera.permissionCheckFailed'); },
    );
    return () => { alive = false; };
  }, [active, focused, getPermission]);
  async function allowCamera() {
    try { await requestPermission(); setError(null); }
    catch { setError('camera.permissionRequestFailed'); }
  }
  const running = focused && active;
  const cameraReady = running && Boolean(permission?.granted) && !error;
  const cameraStatus = !permission ? <>{error ? <><Notice>{t(error)}</Notice><Action title={t('common.retry')} onPress={() => void checkPermission()} /></> : <Notice busy>{t('camera.checking')}</Notice>}</> :
    !permission.granted ? <><Notice>{t('camera.permission')}</Notice>{permission.canAskAgain ? <Action title={t('camera.allow')} onPress={() => void allowCamera()} /> : <SystemSettingsAction />}{error && <Notice>{t(error)}</Notice>}</> :
      error ? <><Notice>{t(error)}</Notice><Action title={t('camera.retry')} onPress={() => { if (error === 'camera.permissionCheckFailed') void checkPermission(); else setError(null); }} /></> : null;
  return <ArDiscovery location={location} running={running} cameraReady={cameraReady}
    preview={cameraReady ? <CameraView style={StyleSheet.absoluteFill} facing="back" onMountError={() => setError('camera.mountFailed')} /> : null}
    cameraStatus={<>{cameraStatus}{diagnostics}</>} />;
}
