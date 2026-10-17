import { expect, it } from 'vitest';
import { activationRadiusSchema, readPreferences, resolveLanguage } from './preferences';
it('defaults activation radius to 100 meters independently of discovery', () => {
  expect(readPreferences(null, 'ko-KR')).toEqual({ activationRadiusMeters: 100, language: 'ko' });
});
it('validates finite integer activation radii and falls back on corrupt fields', () => {
  for (const value of [10, 100, 1000]) expect(activationRadiusSchema.safeParse(value).success).toBe(true);
  for (const value of [0, -1, 1001, 10.5, NaN, Infinity]) expect(activationRadiusSchema.safeParse(value).success).toBe(false);
  expect(readPreferences('{broken', 'ja-JP')).toEqual({ activationRadiusMeters: 100, language: 'ja' });
  expect(readPreferences('{"activationRadiusMeters":-1,"language":"ko"}', 'en')).toEqual({ activationRadiusMeters: 100, language: 'ko' });
});
it('supports regional locale tags with English fallback', () => {
  expect(resolveLanguage('JA-jp')).toBe('ja'); expect(resolveLanguage('ko-KR')).toBe('ko');
  expect(resolveLanguage('fr-FR')).toBe('en'); expect(resolveLanguage(null)).toBe('en');
});
