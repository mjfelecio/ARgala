import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Spinner } from 'heroui-native/spinner';
import { Button } from 'heroui-native/button';
import { useTranslation } from 'react-i18next';
import { useCSSVariable, useResolveClassNames, withUniwind } from 'uniwind';
import type { Coordinate } from '@/features/location/geo';
import type { Place } from '@/features/places/service';

const StyledMapView = withUniwind(MapView);
export function RoutePreviewMap({ place, origin, destination, coordinates, currentPosition, dockHeight, enabled, onViewportHeight }: {
  place: Place; origin?: Coordinate; destination: Coordinate; coordinates: Coordinate[]; currentPosition: Coordinate | null;
  dockHeight: number; enabled: boolean; onViewportHeight(height: number): void;
}) {
  const { t } = useTranslation();
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [controlsHeight, setControlsHeight] = useState(0);
  const gutter = useResolveClassNames('p-4').padding as number;
  const routeColor = useCSSVariable('--color-route') as string;
  const destinationColor = useCSSVariable('--color-brand-primary') as string;
  // Layout callbacks can arrive in either order during a resize. Bound native
  // padding immediately and defer fitting until the dock catches up to its cap.
  const bottom = Math.min(dockHeight, size.height * 0.55);
  const availableHeight = Math.max(0, size.height - bottom);
  const top = Math.min(controlsHeight + gutter, availableHeight * 0.6);
  const drawableHeight = availableHeight - top;
  const drawableWidth = size.width - gutter * 2;
  const canFit = ready && enabled && drawableWidth > 0 && drawableHeight > 0 && dockHeight > 0 &&
    dockHeight <= size.height * 0.55 + 1 && coordinates.length > 1;
  // Header/safe areas are outside the scene. Android adds fit edgePadding to
  // mapPadding, so reserve the dock once and keep both within the drawable area.
  const gap = Math.max(0, Math.min(gutter, drawableHeight / 4, drawableWidth / 4));
  const fit = useCallback(() => {
    if (!canFit) return;
    map.current?.fitToCoordinates(coordinates, { edgePadding: { top: gap, bottom: gap, left: gap, right: gap }, animated: true });
  }, [canFit, coordinates, gap]);
  useEffect(() => { fit(); }, [fit, size.width, size.height, dockHeight, controlsHeight]);
  return <>
    <StyledMapView ref={map} className="absolute inset-0" provider={PROVIDER_GOOGLE}
      initialRegion={{ ...(origin ?? place.coordinates), latitudeDelta: 0.02, longitudeDelta: 0.02 }}
      {...(ready ? { mapPadding: { top, bottom, left: gutter, right: gutter } } : {})}
      showsUserLocation={!!currentPosition} showsMyLocationButton={false} onMapReady={() => setReady(true)}
      onLayout={event => { const { width, height } = event.nativeEvent.layout; setSize({ width, height }); onViewportHeight(height); }}>
      {origin && <Marker coordinate={origin} title={t('directions.origin')} pinColor={routeColor} />}
      <Marker coordinate={destination} title={place.name} pinColor={destinationColor} />
      {coordinates.length > 1 && <Polyline coordinates={coordinates} strokeColor={routeColor} strokeWidth={5} />}
    </StyledMapView>
    {!ready && <View pointerEvents="none" className="absolute left-4 top-4 gap-2 rounded-card bg-surface p-3"><Spinner size="sm" /><Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t('map.loading')}</Text></View>}
    <View className="absolute right-4 top-4 flex-row gap-2" onLayout={event => setControlsHeight(event.nativeEvent.layout.height)}>
      <Button variant="secondary" isIconOnly accessibilityLabel={t('directions.fit')} isDisabled={!canFit} onPress={fit}>
        <Ionicons name="scan-outline" size={24} color={destinationColor} />
      </Button>
      <Button variant="secondary" isIconOnly accessibilityLabel={t('directions.recenter')} isDisabled={!ready || !enabled || !currentPosition}
        onPress={() => { if (ready && enabled && currentPosition) map.current?.animateToRegion({ ...currentPosition, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400); }}>
        <Ionicons name="locate-outline" size={24} color={destinationColor} />
      </Button>
    </View>
  </>;
}
