export const onboardingStorageKey = 'argala.onboarding.v1' as const;

export function isOnboardingComplete(raw: string | null): boolean {
  return raw === 'complete';
}

export function shouldShowWelcome({ marker, legacyPreferences, hasSession }: {
  marker: string | null;
  legacyPreferences: string | null;
  hasSession: boolean;
}): boolean {
  if (hasSession || isOnboardingComplete(marker)) return false;
  // A pending marker identifies preferences written by an unfinished Continue,
  // including a restart after the final completion write failed.
  return marker !== null || legacyPreferences === null;
}
