import { expect, it } from 'vitest';
import { fitPhotoInsideRoundedFrame } from './native-panel-geometry';

it('fits portrait, landscape and square originals without changing aspect or upscaling an already safe image', () => {
  for (const photo of [{ width: 0.7, height: 1.05 }, { width: 1.2, height: 0.7 }, { width: 1, height: 1 }]) {
    const original = { ...photo }; const frame = { width: photo.width + 0.04, height: photo.height + 0.04 };
    const safe = fitPhotoInsideRoundedFrame(photo, frame);
    expect(safe.width / safe.height).toBeCloseTo(photo.width / photo.height);
    expect(safe.width).toBeLessThanOrEqual(photo.width); expect(safe.height).toBeLessThanOrEqual(photo.height);
    expect(photo).toEqual(original);
    expect(fitPhotoInsideRoundedFrame({ width: 0.1, height: 0.1 }, frame)).toEqual({ width: 0.1, height: 0.1 });
  }
});
