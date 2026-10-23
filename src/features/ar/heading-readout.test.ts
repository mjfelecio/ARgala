import { describe, expect, it } from 'vitest';
import { headingReadout } from './heading-readout';

describe('display-only compass readout', () => {
  it('holds small heading noise and crosses a buffered ten-degree boundary in both directions', () => {
    let shown = headingReadout(null, 233);
    expect(shown).toBe(230);
    for (const raw of [235, 231, 229, 234, 232, 238]) {
      shown = headingReadout(shown, raw);
      expect(shown).toBe(230);
    }
    expect(headingReadout(shown, 239)).toBe(240);
    expect(headingReadout(240, 232)).toBe(240);
    expect(headingReadout(240, 231)).toBe(230);
  });
  it('uses circular distance at north without jumping through the opposite direction', () => {
    for (const raw of [359, 1, 358, 2, 360]) expect(headingReadout(0, raw)).toBe(0);
    expect(headingReadout(350, 2)).toBe(0);
    expect(headingReadout(0, 348)).toBe(350);
  });
  it('responds immediately to deliberate 90 and 180 degree turns', () => {
    expect(headingReadout(0, 91)).toBe(90);
    expect(headingReadout(90, 269)).toBe(270);
    expect(headingReadout(270, 90)).toBe(90);
  });
  it('clears invalid readings and reacquires from a fresh target', () => {
    for (const raw of [null, NaN, Infinity, -1, 361]) expect(headingReadout(230, raw)).toBeNull();
    expect(headingReadout(null, 236)).toBe(240);
    expect(headingReadout(null, 360)).toBe(0);
  });
});
