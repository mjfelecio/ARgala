# ARgala Welcome & Language Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the approved first-launch Welcome & Language Selection screen, persisting supported language before authentication while bypassing onboarding for returning users.

**Architecture:** Add an onboarding completion state alongside the existing SettingsProvider, without duplicating its language storage. Gate a new `/welcome` route through the existing Expo Router protected root stack, preserving session authority, and use HeroUI Native/UniWind to reproduce the corrected Stitch layout. There is no backend or sensor work.

**Tech Stack:** Expo SDK 57, Expo Router `Stack.Protected`, TypeScript strict, AsyncStorage, existing SettingsProvider and i18next, UniWind/Tailwind v4, HeroUI Native, existing Vitest/React test renderer.

**Spec:** `docs/design/clean-explorer/SCREEN_SPECIFICATIONS.md` W01, `ARgala_Welcome_Language_Design_Spec.md`, and `references/welcome-stitch-reference.html` in the supplied kickoff package.

## Global Constraints

- Start **only after PR #13 is merged**, from its latest `main` successor. At handoff time PR #13 was open; confirm before branching.
- Workspace root must remain existing `ARgala`; do not scaffold a new project or introduce extra dependencies without SDK/versioned-doc evidence.
- `global.css` is the sole visual-token authority; use HeroUI Native and UniWind for ordinary UI. System/geometry-dependent native styles only where necessary.
- Preserve `argala.preferences.v1` and the existing `save({ activationRadiusMeters, language })` contract, preserving the user's activation radius (default 100 m; 10–1000 m allowed).
- Localization choices are `en`, `ko`, `ja`; the welcome selection never triggers GPS, compass, camera, Places or Routes.
- Welcome is new-user unauthenticated only, not a tab and not shown whenever a user signs out.
- Do not use the Stitch CDN photograph as an approved production asset; screenshot PNG was invalid.
- Keep the code testable and commits small; do not merge the PR.

## Review Focus

1. **Previously installed/signed-in users without onboarding flag:** app skips Welcome, existing session and preferences persist; verify legacy migration and later sign-out.
2. **Partial storage failure:** saved language followed by completion-marker failure leaves Welcome active with retry; no false successful navigation.
3. **Startup race:** asynchronous Auth/Settings/onboarding reads cannot momentarily reveal Sign In/Welcome/App incorrectly or trigger a redirect loop.
4. **Deep links/Back:** access to authenticated tabs or destinations stays protected; back from Sign In does not reopen Welcome after success.
5. **Language layout:** Korean/Japanese glyphs and enlarged text remain usable; language changes don't reset radius or send provider requests.

## Intended file map (verify latest `main` before implementation)

- Create `src/features/onboarding/completion.ts` — pure completion-format/migration decision helpers.
- Create `src/features/onboarding/completion.test.ts` — pure state/migration tests.
- Create `src/features/onboarding/provider.tsx` — onboarding read/complete/retry lifecycle and context.
- Create `src/features/onboarding/provider.test.tsx` — AsyncStorage failure, retry and legacy signed-in behavior tests.
- Create `src/features/onboarding/welcome-screen.tsx` — presentational and interaction UI.
- Create `src/features/onboarding/welcome-screen.test.tsx` — selection, disabled, Save success/failure, localization tests.
- Create `src/app/welcome.tsx` — route re-export.
- Modify `src/app/_layout.tsx` — integrate protected Welcome/Sign-In/App guard without touching inner tab tree.
- Extend existing routing test suite or create `src/features/onboarding/navigation.test.tsx` — guarded-route transitions/deep-link and Back tests using installed SDK router behavior.
- Modify `src/i18n/locales/en.json`, `ko.json`, `ja.json` — first-launch strings/feedback.
- Modify `docs/design/clean-explorer/SCREEN_SPECIFICATIONS.md` or add `docs/design/clean-explorer/WELCOME.md` and `docs/validation.md` — approved reference, intentional differences and evidence.

Do not add catalog/POI/route contracts, database tables, or auth login providers. Avoid changing existing Settings save behavior for ordinary Settings users.

---

### Task 1 — First-launch state and migration

**Files:** `completion.ts`, `completion.test.ts`.

**Interfaces:**
- Produce `export const onboardingStorageKey = 'argala.onboarding.v1' as const`.
- Produce `export function isOnboardingComplete(raw: string | null): boolean` accepting only explicit committed marker `'complete'`.
- Produce `export function shouldShowWelcome(args: { marker: string | null; legacyPreferences: string | null; hasSession: boolean }): boolean` — `true` only when no marker, no earlier preferences, and no authenticated session.

- [ ] Write tests for new install, complete marker, preexisting preferences including malformed legacy data, signed-in bypass, and arbitrary/invalid marker values.
- [ ] Run `npx vitest run src/features/onboarding/completion.test.ts` and confirm the tests fail before the implementation.
- [ ] Implement minimal pure helpers and make the focused tests pass.
- [ ] Commit `feat(onboarding): define first-launch and legacy migration rules`.

### Task 2 — Persistent completion without a second language store

**Files:** `provider.tsx`, `provider.test.tsx`; minimally adjust parent providers if needed.

**Interfaces:**
- Produce `useOnboarding(): { status: 'loading' | 'required' | 'completed' | 'error'; complete(language: 'en' | 'ko' | 'ja'): Promise<void>; retry(): void }`.
- Implementation reads `argala.onboarding.v1` and existing `argala.preferences.v1` on startup; SettingsProvider remains authoritative for selected language and activation radius.
- Completion sequence must be **await** `settings.save({ activationRadiusMeters: settings.activationRadiusMeters, language })`, then `AsyncStorage.setItem(onboardingStorageKey, 'complete')`, then update status.
- If restored auth session exists, bypass Welcome and safely mark an existing account as already onboarded without blocking signed-in app use. Legacy persisted preferences also bypass first-run presentation. Never set completion on an unsuccessful new-user Continue.

- [ ] Write failing provider tests for initial states, completion order, concurrent presses, failed preferences write, failed marker write, retry, legacy preferences, existing auth session and sign-out behavior.
- [ ] Run focused tests and inspect the expected failures.
- [ ] Implement read/restore/error/retry and completion logic. Explicitly guard asynchronous unmount and stale retries; do not expose untranslated storage exceptions in the UI.
- [ ] Verify failed marker writes keep the screen required and retryable without losing activation radius or falsely reporting success.
- [ ] Commit `feat(onboarding): persist completion using existing preferences`.

### Task 3 — Protected routing and stable returning-user behavior

**Files:** `src/app/_layout.tsx`, `src/app/welcome.tsx`, `src/features/onboarding/navigation.test.tsx` (or extend current navigator tests).

**Interfaces:**
- Authenticated session → existing `(app)` protected route, regardless of onboarding flag.
- Unauthenticated & onboarding required → new `/welcome` route.
- Unauthenticated & onboarding completed → existing `/sign-in` route.
- Wait until both auth and onboarding determination finish; preserve environment-missing and auth-restoration failure UI.
- No onboarding route inside the authenticated tabs. Existing sign-in, logout, Settings, direct-link behaviors preserved.

- [ ] Write failing tests for fresh install, Continue routing, existing signed-in user, existing signed-out user, sign-out after onboarding, deep-linked private route, and Android Back.
- [ ] Use the installed Expo Router version's documented protected-stack API; preserve existing app route registrations and error handling.
- [ ] Make routing tests pass and confirm no auth/GPS/paid-request side effects from showing welcome.
- [ ] Commit `feat(navigation): add protected first-launch welcome route`.

### Task 4 — Stitch-aligned native Welcome screen

**Files:** `welcome-screen.tsx`, `welcome-screen.test.tsx`, `src/i18n/locales/{en,ko,ja}.json`; optional approved local image asset only if provenance/rights confirmed.

**Interfaces:**
- Consume `useSettings().language` and `useOnboarding().complete`, plus `useTranslation` resources.
- User selects exactly one of `en`, `ko`, `ja`; local pending selection updates welcome labels without prematurely changing persisted global preferences.
- Continue invokes one guarded completion, shows loading and translated failure, and becomes inaccessible while saving.

- [ ] Write failing tests for selected state and radio semantics, 3 languages, Continue success/failed save, retry, accessible labels, default device language, no camera/location permission or provider call.
- [ ] Implement scene: clean branded hero, image if approved or explicit elegant mint fallback, tagline “Discover places around you.”; seamless full-height white content area; language rows; CTA and Settings note. No floating form/drag handle/system-bar imitation.
- [ ] Use HeroUI Native Button/Surface and documented selection primitive if compatible; otherwise use a small accessible selection wrapper without reinventing generic component library. Use `className` and semantic `global.css` tokens; do not add standalone TS theme.
- [ ] Confirm English/Korean/Japanese content resources cover app-owned screen copy and error/retry states.
- [ ] Make focused tests pass. Compare Android layout against available source HTML and note unavailable corrected PNG/image rights explicitly.
- [ ] Commit `feat(onboarding): render welcome and language selection`.

### Task 5 — Integration, verification, documentation and PR

**Files:** integration/regression tests, `docs/validation.md`, `docs/design/clean-explorer/WELCOME.md` (or equivalent).

- [ ] Exercise the **real SettingsProvider** persistence and actual source locales, not just mocked save. Confirm 100 m/custom radius survives chosen-language persistence/restart.
- [ ] Run focused navigation and UI tests with the production Query defaults to ensure first-launch UI never spends provider quotas on mount/remount/locale change.
- [ ] Run `npm run check` — expected: typecheck, zero-warning lint, all tests passing.
- [ ] Run `npx expo install --check`, `npx expo-doctor`, `npm run check:android`, and `npm run export:android`; state precisely which ran. If native assets/config change, perform a real Android development build where credentials/runner permit it.
- [ ] Run `git diff --check`, inspect the full diff for secrets, fabricated media, unrelated refactors and visual tokens outside CSS.
- [ ] Document Android manual checks: fresh installed storage, returning account, uninstall/reinstall, three languages, 150% font scale/CJK, restored auth, sign-out, offline/failed preference write, gesture/three-button Back and deeplinks.
- [ ] Commit documentation/test changes using an accurate Conventional Commit subject; push branch and create one PR against `main`. Do **not merge**.

## Completion criteria

A new unauthenticated installation gets a beautiful, navigable, localized Welcome screen; language is safely persisted before Sign In; a returning user skips Welcome; failed writes are recoverable; normal authenticated app, Map/AR, provider-cost behavior and tabs remain unchanged. Android APK/device UAT must be explicitly distinguished from unit tests and Metro export.

## Execution handoff

Present the agent with this plan, design spec and corrected source HTML. Implement on a dedicated `feat/welcome-language` branch from the current merged `main` after PR #13. Keep coherent commits and submit PR for review; do not merge or claim device validation without evidence.
