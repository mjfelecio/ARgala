import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { preferencesSchema, type Preferences } from './preferences';
import { useSettings } from './provider';

function initialDraft(preferences: Preferences) {
  return { radius: String(preferences.activationRadiusMeters), language: preferences.language,
    baselineRadius: preferences.activationRadiusMeters, baselineLanguage: preferences.language };
}
export function useSettingsDraft() {
  const settings = useSettings();
  const focused = useIsFocused();
  const focusedRef = useRef(focused);
  focusedRef.current = focused;
  const alive = useRef(true);
  const submitting = useRef(false);
  const [draft, setDraft] = useState(() => initialDraft(settings));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<'common.saved' | 'settings.saveFailed' | null>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const { activationRadiusMeters, language } = settings;
  useEffect(() => {
    setDraft(previous => {
      const pristine = previous.radius === String(previous.baselineRadius) && previous.language === previous.baselineLanguage;
      if (!focused || pristine) return initialDraft({ activationRadiusMeters, language });
      return { ...previous, baselineRadius: activationRadiusMeters, baselineLanguage: language };
    });
    if (!focused) setMessage(null);
  }, [activationRadiusMeters, language, focused]);
  const dirty = draft.radius !== String(activationRadiusMeters) || draft.language !== language;
  const parsed = preferencesSchema.safeParse({ activationRadiusMeters: draft.radius.trim() === '' ? NaN : Number(draft.radius), language: draft.language });
  function changeRadius(radius: string) {
    if (submitting.current) return;
    setDraft(previous => ({ ...previous, radius })); setMessage(null);
  }
  function changeLanguage(next: Preferences['language']) {
    if (submitting.current) return;
    setDraft(previous => ({ ...previous, language: next })); setMessage(null);
  }
  async function save() {
    if (submitting.current || !focused || !dirty || !parsed.success) return;
    submitting.current = true; setBusy(true); setMessage(null);
    try {
      await settings.save(parsed.data);
      if (alive.current) {
        setDraft(initialDraft(parsed.data));
        if (focusedRef.current) setMessage('common.saved');
      }
    } catch {
      if (alive.current && focusedRef.current) setMessage('settings.saveFailed');
    } finally {
      submitting.current = false;
      if (alive.current) setBusy(false);
    }
  }
  return { radius: draft.radius, language: draft.language, changeRadius, changeLanguage, busy, message,
    dirty, valid: parsed.success, save, storageError: settings.storageError };
}
