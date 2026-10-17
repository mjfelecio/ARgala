import { createInstance } from 'i18next';
import { expect, it } from 'vitest';
import { localizationOptions } from './options';
it('uses Korean/Japanese resources and English for untranslated content', async () => {
  const instance = createInstance(); await instance.init({ ...localizationOptions, lng: 'ja' });
  expect(instance.t('map.title')).toBe('近くの場所');
  expect(instance.t('location.denied')).toBe('Location permission is required to discover nearby places.');
  await instance.changeLanguage('ko'); expect(instance.t('map.title')).toBe('주변 장소');
});
