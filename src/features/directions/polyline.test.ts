import { expect, it } from 'vitest';
import { decodePolyline } from './polyline';
it('decodes the Google encoded-polyline reference example', () => {
  expect(decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@')).toEqual([{ latitude: 38.5, longitude: -120.2 }, { latitude: 40.7, longitude: -120.95 }, { latitude: 43.252, longitude: -126.453 }]);
});
it('rejects empty, truncated and invalid encodings', () => {
  for (const value of ['', '_p~iF', '!', '~~~~~~~~~~~~']) expect(() => decodePolyline(value)).toThrow();
});
