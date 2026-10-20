import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Spinner } from 'heroui-native/spinner';
import { Button } from 'heroui-native/button';
import { useTranslation } from 'react-i18next';
import { useCSSVariable, useResolveClassNames, withUniwind } from 'uniwind';
import { useExplorerMapStyle } from '@/features/map/map-style';
import type { Coordinate } from '@/features/location/geo';
import type { Place } from '@/features/places/service';

const StyledMapView = withUniwind(MapView);
export function RoutePreviewMap({ place, origin, destination, coordinates, currentPosition, dockHeight, settledDockHeight, headerHeight, position, enabled, onViewportHeight }: {
  place: Place; origin?: Coordinate; destination: Coordinate; coordinates: Coordinate[]; currentPosition: Coordinate | null;
  dockHeight: number; settledDockHeight: number; headerHeight: number; position: SharedValue<number>; enabled: boolean; onViewportHeight(height: number): void;
}) {
  const { t } = useTranslation();
  const customMapStyle = useExplorerMapStyle();
  const map = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const gutter = useResolveClassNames('p-4').padding as number;
  const routeColor = useCSSVariable('--color-route') as string;
  const destinationColor = useCSSVariable('--color-brand-primary') as string;
  const cap = Math.max(0, size.height - headerHeight - 64);
  const settledBottom = Math.min(settledDockHeight, cap);
  const top = Math.min(headerHeight + gutter, Math.max(0, size.height - settledBottom - gutter));
  const bottom = Math.min(dockHeight, Math.max(0, size.height - top - gutter));
  const drawableHeight = size.height - settledBottom - top;
  const drawableWidth = size.width - gutter * 2;
  const canFit = ready && enabled && headerHeight > 0 && drawableWidth > 0 && drawableHeight > 0 && settledDockHeight > 0 &&
    settledDockHeight <= cap + 1 && coordinates.length > 1;
  const gap = Math.max(0, Math.min(gutter, drawableHeight / 4, drawableWidth / 4));
  const controlsStyle = useAnimatedStyle(() => ({ transform: [{ translateY: Math.max(0, position.get() - 64) }] }));
  const fit = useCallback(() => {
    if (!canFit) return;
    map.current?.fitToCoordinates(coordinates, { edgePadding: { top: gap, bottom: gap, left: gap, right: gap }, animated: true });
  }, [canFit, coordinates, gap]);
  useEffect(() => { fit(); }, [fit, size.width, size.height, settledDockHeight, headerHeight]);
  return <>
    <StyledMapView ref={map} className="absolute inset-0" provider={PROVIDER_GOOGLE} customMapStyle={customMapStyle}
      initialRegion={{ ...(origin ?? place.coordinates), latitudeDelta: 0.02, longitudeDelta: 0.02 }}
      {...(ready ? { mapPadding: { top, bottom, left: gutter, right: gutter } } : {})}
      showsUserLocation={!!currentPosition} showsMyLocationButton={false} onMapReady={() => setReady(true)}
      onLayout={event => { const { width, height } = event.nativeEvent.layout; setSize({ width, height }); onViewportHeight(height); }}>
      {origin && <Marker coordinate={origin} title={t('directions.origin')} pinColor={routeColor} />}
      <Marker coordinate={destination} title={place.name} pinColor={destinationColor} />
      {coordinates.length > 1 && <Polyline coordinates={coordinates} strokeColor={routeColor} strokeWidth={5} />}
    </StyledMapView>
    {!ready && <View pointerEvents="none" className="absolute left-4 gap-2 rounded-card bg-surface p-3" style={{ top: headerHeight + 8 }}><Spinner size="sm" /><Text accessibilityLiveRegion="polite" className="font-sans text-sm text-muted">{t('map.loading')}</Text></View>}
    <Animated.View testID="route-map-controls" className="absolute right-4 top-0 flex-row gap-2" style={controlsStyle}>
      <Button variant="secondary" isIconOnly accessibilityLabel={t('directions.fit')} isDisabled={!canFit} onPress={fit}>
        <Ionicons name="scan-outline" size={24} color={destinationColor} />
      </Button>
      <Button variant="secondary" isIconOnly accessibilityLabel={t('directions.recenter')} isDisabled={!ready || !enabled || !currentPosition}
        onPress={() => { if (ready && enabled && currentPosition) map.current?.animateToRegion({ ...currentPosition, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 400); }}>
        <Ionicons name="locate-outline" size={24} color={destinationColor} />
      </Button>
    </Animated.View>
  </>;
}
