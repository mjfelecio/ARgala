import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import { useAuth } from '@/features/auth/provider';
import { useSettings } from '@/features/settings/provider';
import type { Language } from '../../../supabase/functions/_shared/contracts';
import { isOnboardingComplete, onboardingStorageKey, shouldShowWelcome } from './completion';

type OnboardingState = {
  status: 'loading' | 'required' | 'completed' | 'error';
  complete: (language: Language) => Promise<void>;
  retry: () => void;
};
const OnboardingContext = createContext<OnboardingState | null>(null);
const preferencesStorageKey = 'argala.preferences.v1';

export function OnboardingProvider({ children }: PropsWithChildren) {
  const { session, loading, error } = useAuth();
  const settings = useSettings();
  const [status, setStatus] = useState<OnboardingState['status']>('loading');
  const [attempt, setAttempt] = useState(0);
  const completed = useRef(false);
  const revision = useRef(0);
  const saving = useRef<Promise<void> | null>(null);
  const hasSession = Boolean(session);

  useEffect(() => {
    const current = ++revision.current;
    const active = () => current === revision.current;
    void (async () => {
      // Restore from external storage after the current auth snapshot settles.
      await Promise.resolve();
      if (!active()) return;
      if (hasSession) {
        // A restored account is authoritative even when local storage is broken.
        completed.current = true;
        setStatus('completed');
        void AsyncStorage.setItem(onboardingStorageKey, 'complete').catch(() => {});
      } else if (completed.current) {
        setStatus('completed');
      } else if (!loading && !error) {
        setStatus('loading');
        const [marker, legacyPreferences] = await Promise.all([
          AsyncStorage.getItem(onboardingStorageKey), AsyncStorage.getItem(preferencesStorageKey),
        ]);
        if (!active()) return;
        if (shouldShowWelcome({ marker, legacyPreferences, hasSession: false })) {
          setStatus('required');
          return;
        }
        // Commit legacy migration before exposing Sign In. Preferences stay intact.
        if (!isOnboardingComplete(marker)) await AsyncStorage.setItem(onboardingStorageKey, 'complete');
        if (active()) { completed.current = true; setStatus('completed'); }
      }
    })().catch(() => { if (active()) setStatus('error'); });
    return () => { revision.current += 1; };
  }, [hasSession, loading, error, attempt]);

  function complete(language: Language): Promise<void> {
    if (saving.current) return saving.current;
    if (completed.current) return Promise.resolve();
    if (status !== 'required') return Promise.reject(new Error('Onboarding is not ready.'));
    const current = revision.current;
    const active = () => current === revision.current;
    const operation = (async () => {
      // Distinguish this preference write from a pre-W01 installation after restart.
      await AsyncStorage.setItem(onboardingStorageKey, 'pending');
      if (!active()) return;
      await settings.save({ activationRadiusMeters: settings.activationRadiusMeters, language });
      if (!active()) return;
      await AsyncStorage.setItem(onboardingStorageKey, 'complete');
      if (active()) { completed.current = true; setStatus('completed'); }
    })();
    saving.current = operation;
    void operation.finally(() => { if (saving.current === operation) saving.current = null; }).catch(() => {});
    return operation;
  }

  function retry() {
    if (saving.current) return;
    setStatus('loading');
    setAttempt(value => value + 1);
  }

  return <OnboardingContext.Provider value={{ status, complete, retry }}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error('OnboardingProvider is missing.');
  return value;
}
