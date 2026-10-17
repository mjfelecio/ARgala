import en from './locales/en.json';
import ko from './locales/ko.json';
import ja from './locales/ja.json';
export const localizationOptions = { resources: { en: { translation: en }, ko: { translation: ko }, ja: { translation: ja } }, supportedLngs: ['en', 'ko', 'ja'], fallbackLng: 'en', interpolation: { escapeValue: false }, initAsync: false };
