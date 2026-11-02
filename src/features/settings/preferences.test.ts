import { expect, it } from 'vitest';
import { activationRadiusSchema, readPreferences, resolveLanguage } from './preferences';
it('defaults activation radius to 100 meters independently of discovery', () => {
  expect(readPreferences(null, 'ko-KR')).toEqual({ activationRadiusMeters: 100, language: 'ko', systemVoice: true, soundEffects: true });
});
it('validates finite integer activation radii and falls back on corrupt fields', () => {
  for (const value of [10, 100, 1000]) expect(activationRadiusSchema.safeParse(value).success).toBe(true);
  for (const value of [0, -1, 1001, 10.5, NaN, Infinity]) expect(activationRadiusSchema.safeParse(value).success).toBe(false);
  expect(readPreferences('{broken', 'ja-JP')).toEqual({ activationRadiusMeters: 100, language: 'ja', systemVoice: true, soundEffects: true });
  expect(readPreferences('{"activationRadiusMeters":-1,"language":"ko"}', 'en')).toEqual({ activationRadiusMeters: 100, language: 'ko', systemVoice: true, soundEffects: true });
});
it('supports regional locale tags with English fallback', () => {
  expect(resolveLanguage('JA-jp')).toBe('ja'); expect(resolveLanguage('ko-KR')).toBe('ko');
  expect(resolveLanguage('fr-FR')).toBe('en'); expect(resolveLanguage(null)).toBe('en');
});
it('migrates legacy preferences without changing language/radius and independently preserves the two audio choices', () => {
  expect(readPreferences('{"activationRadiusMeters":123,"language":"ja"}', 'ko')).toEqual({ activationRadiusMeters: 123, language: 'ja', systemVoice: true, soundEffects: true });
  expect(readPreferences('{"activationRadiusMeters":123,"language":"ko","systemVoice":false,"soundEffects":true}')).toMatchObject({ systemVoice: false, soundEffects: true });
  expect(readPreferences('{"systemVoice":true,"soundEffects":false}')).toMatchObject({ systemVoice: true, soundEffects: false });
  expect(readPreferences('{"systemVoice":"false","soundEffects":0}')).toMatchObject({ systemVoice: true, soundEffects: true });
});
