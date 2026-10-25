import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useIsFocused, useNavigation } from 'expo-router';
import type { NativeStackNavigationProp } from 'expo-router/native-stack';
import { Text, View } from 'react-native';
import { Button } from 'heroui-native/button';
import type { RingControls, RingMetrics } from './destination-ring-scene';
import { useTranslation } from 'react-i18next';
import { useAppActive } from '@/lib/use-app-active';
import { FocusedStatusBar } from '@/features/navigation/focused-status-bar';
import { Notice } from '@/ui/shared';
import { ArUtilityChrome } from './ar-utility-chrome';
import { ArPreflight } from './ar-preflight';
import { useViroStartup } from './use-viro-startup';
import type { TrackingState } from './types';

// Do not evaluate Viro's native components in old APKs or before capability checks.
const NativeScene = lazy(() => import('./destination-scene').then(module => ({ default: module.DestinationSceneHost })));
const NativeRing = lazy(() => import('./destination-ring-scene').then(module => ({ default: module.DestinationRingSceneHost })));
class SceneBoundary extends Component<{ onFailure(): void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export default function DestinationArScreen({ variant = 'square' }: { variant?: 'square' | 'ring' }) {
  const { t } = useTranslation();
  const focused = useIsFocused(); const active = useAppActive();
  const stack = useNavigation<NativeStackNavigationProp<Record<string, object | undefined>>>('/(app)');
  const [transitionReady, setTransitionReady] = useState(true);
  const [scene, setScene] = useState({ width: 0, height: 0 });
  const [tracking, setTracking] = useState<TrackingState>('unavailable');
  const ringControls = useRef<RingControls | null>(null);
  const acceptControls = useCallback((value: RingControls | null) => { ringControls.current = value; }, []);
  const [help, setHelp] = useState(false); const [poseRequired, setPoseRequired] = useState(false);
  const recenterResult = useCallback((success: boolean) => setPoseRequired(!success), []);
  const [metrics, setMetrics] = useState<RingMetrics>({ received: 0, applied: 0 });
  useEffect(() => {
    const start = stack.addListener('transitionStart', event => { if (!event.data.closing) setTransitionReady(false); });
    const end = stack.addListener('transitionEnd', event => { if (!event.data.closing) setTransitionReady(true); });
    return () => { start(); end(); };
  }, [stack]);
  const startup = useViroStartup({ running: focused && active, transitionReady, measured: scene.width > 0 && scene.height > 0 });
  return <View testID="destination-ar-scene" className="flex-1 bg-ink" onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setScene(previous => previous.width === width && previous.height === height ? previous : { width, height });
  }}>
    <FocusedStatusBar style="light" />
    {startup.mountScene && <View style={{ position: 'absolute', top: 0, left: 0, width: scene.width, height: scene.height }}>
      <SceneBoundary key={startup.attempt} onFailure={startup.onFailure}>
        <Suspense fallback={null}>{variant === 'ring'
          ? <NativeRing onReady={startup.onReady} onTracking={setTracking} onControls={acceptControls} onRecenterResult={recenterResult} onMetrics={help ? setMetrics : undefined} />
          : <NativeScene onReady={startup.onReady} onTracking={setTracking} />}</Suspense>
      </SceneBoundary>
    </View>}
    <ArUtilityChrome titleKey={variant === 'ring' ? 'destinationRing.title' : 'destinationAr.title'} actions={variant === 'ring' && startup.phase === 'live' ? <>
      <Button variant="secondary" accessibilityLabel={t('destinationRing.recenter')} isDisabled={tracking !== 'normal'} onPress={() => ringControls.current?.recenter()}><Button.Label>{t('destinationRing.recenter')}</Button.Label></Button>
      <Button variant="secondary" accessibilityLabel={t('destinationRing.help')} accessibilityState={{ expanded: help }} onPress={() => setHelp(value => !value)}><Button.Label>{t('destinationRing.help')}</Button.Label></Button>
    </> : undefined}>
      <ArPreflight phase={startup.phase} pending={startup.pending} canAskAgain={startup.canAskAgain} errorCode={startup.errorCode} onStart={prompt => void startup.start(prompt)} />
      {startup.phase === 'live' && <View className="gap-2 p-4">
        {variant === 'ring' ? <>
          <Text className="font-sans text-sm text-white">{t(tracking === 'normal' ? 'destinationRing.live' : 'destinationAr.trackingLost')}</Text>
          <Text className="font-sans text-xs text-white">{t('destinationRing.prototype')}</Text>
          {poseRequired && <Notice>{t('destinationRing.poseRequired')}</Notice>}
          {help && <Notice>{t('destinationRing.helpText')}{'\n'}{t('destinationRing.poseRate', metrics)}</Notice>}
        </> : <>
          <Notice>{t(tracking === 'normal' ? 'destinationAr.live' : 'destinationAr.trackingLost')}</Notice>
          <Text className="font-sans text-sm text-white">{t('destinationAr.prototype')}</Text>
        </>}
      </View>}
    </ArUtilityChrome>
  </View>;
}
