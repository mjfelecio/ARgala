/** Clean Explorer values are native logical units. Typography uses system glyph fallback. */
export const colors = {
  brandPrimary: '#247A53', brandStrong: '#174D38', mint: '#E7F4EC', surface: '#FFFFFF',
  pageMint: '#EEFDF3', text: '#1C2923', textSecondary: '#3F4942', border: '#E2EBE5',
  routeBlue: '#2A72E5', danger: '#BA1A1A',
} as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const radii = { input: 16, card: 20, sheet: 28, pill: 9999 } as const;
export const targets = { minimum: 48, input: 52, prominent: 56 } as const;
export const typeScale = {
  hero: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  card: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  metadata: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  action: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
} as const;
