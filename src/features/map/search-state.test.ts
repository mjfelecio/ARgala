import { expect, it } from 'vitest';
import { areaFromRegion } from './search-state';
it('captures viewport geometry with the explicit 5000m search cap', () => {
 expect(areaFromRegion({ latitude: 0, longitude: 0, latitudeDelta: 0.01, longitudeDelta: 0.01 })).toMatchObject({ center: { latitude: 0, longitude: 0 } });
 expect(areaFromRegion({ latitude: 0, longitude: 0, latitudeDelta: 100, longitudeDelta: 300 })?.radiusMeters).toBe(5000);
});
it('wraps antimeridian corners and rejects invalid/unsettled regions', () => {
 expect(areaFromRegion({ latitude: 0, longitude: 179.999, latitudeDelta: 0.01, longitudeDelta: 0.01 })?.radiusMeters).toBeLessThan(1000);
 for (const latitudeDelta of [0, -1, NaN, Infinity]) expect(areaFromRegion({ latitude: 0, longitude: 0, latitudeDelta, longitudeDelta: 1 })).toBeNull();
});
