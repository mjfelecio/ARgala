import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { deviceLanguage } from '@/i18n';
import { Notice, Screen } from '@/ui/shared';
import { preferencesSchema, readPreferences, type Preferences } from './preferences';
const storageKey = 'argala.preferences.v1';
const SettingsContext = createContext<(Preferences & { storageError: string | null; save: (value: Preferences) => Promise<void> }) | null>(null);
export function SettingsProvider({ children }: PropsWithChildren) {
  const { t } = useTranslation();
  const [preferences, setPreferences] = useState(() => readPreferences(null, deviceLanguage));
  const [ready, setReady] = useState(false); const [storageError, setStorageError] = useState<string | null>(null);
  const saving = useRef(false);
  useEffect(() => {
    let alive = true;
    void AsyncStorage.getItem(storageKey).then(async (raw) => {
      const loaded = readPreferences(raw, deviceLanguage); await i18n.changeLanguage(loaded.language);
      if (alive) { setPreferences(loaded); setReady(true); }
    }).catch(() => { if (alive) { setStorageError('settings.loadFailed'); setReady(true); } });
    return () => { alive = false; };
  }, []);
  async function save(value: Preferences) {
    const next = preferencesSchema.parse(value);
    if (saving.current) throw new Error('A settings save is already in progress.');
    saving.current = true;
    try { await AsyncStorage.setItem(storageKey, JSON.stringify(next)); await i18n.changeLanguage(next.language); setPreferences(next); setStorageError(null); }
    finally { saving.current = false; }
  }
  if (!ready) return <Screen><Notice busy>{t('common.loading')}</Notice></Screen>;
  return <SettingsContext.Provider value={{ ...preferences, storageError, save }}>{children}</SettingsContext.Provider>;
}
export function useSettings() {
  const value = useContext(SettingsContext); if (!value) throw new Error('SettingsProvider is missing.'); return value;
}
