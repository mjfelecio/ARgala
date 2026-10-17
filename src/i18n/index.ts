import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { resolveLanguage } from '@/features/settings/preferences';
import { localizationOptions } from './options';
const i18n = createInstance();
export const deviceLanguage = resolveLanguage(getLocales()[0]?.languageTag);
void i18n.use(initReactI18next).init({ ...localizationOptions, lng: deviceLanguage, react: { useSuspense: false } });
export default i18n;
