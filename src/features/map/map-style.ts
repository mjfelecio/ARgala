import { useMemo } from 'react';
import type { MapStyleElement } from 'react-native-maps';
import { useCSSVariable } from 'uniwind';

/**
 * Google style values resolve from the same CSS tokens as the application UI.
 * Keep MapView.userInterfaceStyle unset on Android: explicit overrides hit the
 * crashing Fabric initial-props enum path. The version-checked Android patch
 * keeps the default map light; these CSS values supply its styling.
 */
export function useExplorerMapStyle(): MapStyleElement[] {
  const [land, park, water, road, major, outline, text, muted] = useCSSVariable([
    '--color-map-land', '--color-map-park', '--color-map-water', '--color-map-road',
    '--color-map-road-major', '--color-map-road-outline', '--color-ink', '--color-ink-secondary',
  ]) as string[];
  return useMemo(() => [
    { elementType: 'geometry', stylers: [{ color: land }] },
    { elementType: 'labels.text.fill', stylers: [{ color: text }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: land }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: park }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: park }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: water }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: muted }] },
    { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: road }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: outline }] },
    { featureType: 'road.highway', elementType: 'geometry.fill', stylers: [{ color: major }] },
    { featureType: 'poi.business', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  ], [land, park, water, road, major, outline, text, muted]);
}
