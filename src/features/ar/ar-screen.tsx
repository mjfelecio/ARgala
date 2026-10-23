import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused, useNavigation } from 'expo-router';
import type { NativeStackNavigationProp } from 'expo-router/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDeviceLocation } from '@/features/location/use-device-location';
import { SystemSettingsAction } from '@/features/location/status';
import { useAppActive } from '@/lib/use-app-active';
import { Action, Notice } from '@/ui/shared';

import { ArDiscovery } from './ar-discovery';

type ParentStackNavigation = NativeStackNavigationProp<Record<string, object | undefined>>;

export default function ArScreen() {
  const { t } = useTranslation();
  const [permission, requestPermission, getPermission] = useCameraPermissions({ get: false });
  const [scene, setScene] = useState({ width: 0, height: 0 });
  const [error, setError] = useState<string | null>(null);
  const stack = useNavigation<ParentStackNavigation>('/(app)');
  const [sceneReady, setSceneReady] = useState(true);
  useEffect(() => {
    // Focus returns before the native stack finishes revealing this scene.
    // Starting CameraX in that interval can leave the inner preview unscaled,
    // even though CameraView already has the correct full-screen bounds.
    const start = stack.addListener('transitionStart', event => {
      if (!event.data.closing) setSceneReady(false);
    });
    const end = stack.addListener('transitionEnd', event => {
      if (!event.data.closing) setSceneReady(true);
    });
    return () => { start(); end(); };
  }, [stack]);
  const active = useAppActive(); const focused = useIsFocused();
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
  const cameraReady = running && sceneReady && Boolean(permission?.granted) && !error && scene.width > 0 && scene.height > 0;
  const cameraStatus = !permission ? <>{error ? <><Notice>{t(error)}</Notice><Action title={t('common.retry')} onPress={() => void checkPermission()} /></> : <Notice busy>{t('camera.checking')}</Notice>}</> :
    !permission.granted ? <><Notice>{t('camera.permission')}</Notice>{permission.canAskAgain ? <Action title={t('camera.allow')} onPress={() => void allowCamera()} /> : <SystemSettingsAction />}{error && <Notice>{t(error)}</Notice>}</> :
      error ? <><Notice>{t(error)}</Notice><Action title={t('camera.retry')} onPress={() => { if (error === 'camera.permissionCheckFailed') void checkPermission(); else setError(null); }} /></> : null;
  return <View testID="ar-scene" className="flex-1 bg-ink" onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    // Ignore transient hidden-screen measurements; the native preview always
    // receives the full positive scene bounds when focus returns.
    if (width > 0 && height > 0) setScene(previous => previous.width === width && previous.height === height ? previous : { width, height });
  }}>
    {cameraReady && <CameraView style={{ position: 'absolute', top: 0, left: 0, width: scene.width, height: scene.height }} facing="back" onMountError={() => setError('camera.mountFailed')} />}
    <ArDiscoveryWithLocation running={running} cameraReady={cameraReady} cameraStatus={cameraStatus} />
  </View>;
}

function ArDiscoveryWithLocation({ running, cameraReady, cameraStatus }: { running: boolean; cameraReady: boolean; cameraStatus: React.ReactNode }) {
  const location = useDeviceLocation({ heading: true, distanceIntervalMeters: 0 });
  return <ArDiscovery location={location} running={running} cameraReady={cameraReady} cameraStatus={cameraStatus} />;
}
