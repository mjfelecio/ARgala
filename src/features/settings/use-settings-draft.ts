import { useIsFocused } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { preferencesSchema, type Preferences } from './preferences';
import { useSettings } from './provider';

function initialDraft(preferences: Preferences, focused: boolean) {
  return { radius: String(preferences.activationRadiusMeters), language: preferences.language,
    baselineRadius: preferences.activationRadiusMeters, baselineLanguage: preferences.language, focused };
}
export function useSettingsDraft() {
  const settings = useSettings();
  const focused = useIsFocused();
  const focusedRef = useRef(focused);
  useEffect(() => { focusedRef.current = focused; }, [focused]);
  const alive = useRef(true);
  const submitting = useRef(false);
  const [draft, setDraft] = useState(() => initialDraft(settings, focused));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<'common.saved' | 'settings.saveFailed' | null>(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const { activationRadiusMeters, language } = settings;
  // Adjust the draft before rendering children when its saved baseline or focus
  // changes. Dirty edits survive external saves; leaving the route abandons them.
  if (draft.baselineRadius !== activationRadiusMeters || draft.baselineLanguage !== language || draft.focused !== focused) {
    const pristine = draft.radius === String(draft.baselineRadius) && draft.language === draft.baselineLanguage;
    setDraft(!focused || pristine ? initialDraft({ activationRadiusMeters, language }, focused)
      : { ...draft, baselineRadius: activationRadiusMeters, baselineLanguage: language, focused });
    if (!focused && message !== null) setMessage(null);
  }
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
        setDraft(initialDraft(parsed.data, focusedRef.current));
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
