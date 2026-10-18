import { expect, it } from 'vitest';
import { colors, radii, space, targets } from './theme';
it('preserves the approved Clean Explorer palette and geometry', () => {
 expect(colors).toEqual({ brandPrimary: '#247A53', brandStrong: '#174D38', mint: '#E7F4EC', surface: '#FFFFFF', pageMint: '#EEFDF3', text: '#1C2923', textSecondary: '#3F4942', border: '#E2EBE5', routeBlue: '#2A72E5', danger: '#BA1A1A' });
 expect(Object.values(space)).toEqual([4, 8, 12, 16, 24, 32]);
 expect(radii).toMatchObject({ input: 16, card: 20, sheet: 28, pill: 9999 });
 expect(targets).toEqual({ minimum: 48, input: 52, prominent: 56 });
});
