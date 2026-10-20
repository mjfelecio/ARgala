import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('changes Android map padding without moving the camera in immediate and deferred paths', () => {
  const source = readFileSync('node_modules/react-native-maps/android/src/main/java/com/rnmaps/maps/MapView.java', 'utf8');
  const immediate = source.slice(source.indexOf('    public void applyBaseMapPadding('), source.indexOf('    public void fitToCoordinates('));
  const deferred = source.slice(source.indexOf('    public void updateExtraData('), source.indexOf('        // if boundsToMove is not null'));
  expect(immediate).toContain('map.setPadding(left, top, right, bottom)');
  expect(immediate).not.toContain('map.moveCamera');
  expect(deferred).not.toContain('map.moveCamera');
});

it('defers native padding until GoogleMap and layout are both ready', () => {
  const source = readFileSync('node_modules/react-native-maps/android/src/main/java/com/rnmaps/maps/MapView.java', 'utf8');
  const immediate = source.slice(source.indexOf('    public void applyBaseMapPadding('), source.indexOf('    public void fitToCoordinates('));
  expect(immediate).toContain('if (map == null || super.getHeight() <= 0 || super.getWidth() <= 0)');
  expect(immediate).toContain('setPaddingDeferred = true');
  const deferred = source.slice(source.indexOf('    public void updateExtraData('), source.indexOf('        // if boundsToMove is not null'));
  expect(deferred).toContain('setPaddingDeferred && map != null');
});
