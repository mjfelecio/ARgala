import { expect, it } from 'vitest';
import { isOnboardingComplete, onboardingStorageKey, shouldShowWelcome } from './completion';

it('recognizes only the committed marker', () => {
  expect(onboardingStorageKey).toBe('argala.onboarding.v1');
  expect(isOnboardingComplete('complete')).toBe(true);
  for (const raw of [null, '', 'pending', 'true', 'COMPLETE', '{}']) expect(isOnboardingComplete(raw)).toBe(false);
});
it('requires Welcome for a fresh installation', () => {
  expect(shouldShowWelcome({ marker: null, legacyPreferences: null, hasSession: false })).toBe(true);
});
it.each(['{}', '{broken', '', '{"language":"ja","activationRadiusMeters":250}'])('recognizes preexisting usage even for malformed preferences %s', raw => {
  expect(shouldShowWelcome({ marker: null, legacyPreferences: raw, hasSession: false })).toBe(false);
});
it('always bypasses completed or authenticated installations', () => {
  expect(shouldShowWelcome({ marker: 'complete', legacyPreferences: null, hasSession: false })).toBe(false);
  for (const marker of [null, 'pending', 'bad']) expect(shouldShowWelcome({ marker, legacyPreferences: null, hasSession: true })).toBe(false);
});
it.each(['pending', 'bad', ''])('does not confuse uncommitted onboarding %s with legacy preferences after a partial save', marker => {
  expect(shouldShowWelcome({ marker, legacyPreferences: '{"language":"ko"}', hasSession: false })).toBe(true);
});
