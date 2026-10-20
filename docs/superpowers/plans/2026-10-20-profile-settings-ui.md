# ARgala Profile & Settings UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder Profile tab and basic Settings page with one approved Clean Explorer interface that persists AR radius/language explicitly and preserves sign-out and navigation.

**Architecture:** Implement shared presentation and a small draft controller in `src/features/settings/`, render that from the existing Profile tab and `/settings` route, and adjust navigator headers only as needed. Use existing `SettingsProvider.save` and Supabase authentication. No backend or sensor feature changes.

**Tech Stack:** Expo SDK 57, Expo Router, TypeScript, UniWind, Tailwind CSS v4, HeroUI Native 1.0.10, i18next, AsyncStorage via `SettingsProvider`, Supabase Auth, Ionicons, Vitest.

**Spec:** `docs/design/clean-explorer/SCREEN_SPECIFICATIONS.md` (S01) and the accompanying `ARgala_Profile_Settings_Design_Spec.md`. Stitch reference: `references/profile-settings-stitch.png` and `.html`.

## Global constraints

- Start from current verified `main`; inspected starting SHA `3a3f7708fcfbea992699094bb9bc46bff9981268`. PR #15 is merged; confirm again at execution time.
- Keep `global.css` as the only application theme authority. No separate TS theme, handcrafted button/radio/slider, NativeWind, or new permissions.
- Existing `preferencesSchema`: language `en|ko|ja`, integer radius **10–1000 m**; default **100 m**. Discovery **1000 m** and destination nearby **500 m** remain independent and untouched.
- Reuse `useSettings().save` (AsyncStorage key `argala.preferences.v1`) and existing sign-out flow. Exactly one explicit save operation per click; no autosave.
- HeroUI's installed Slider exposes `value`, `minValue`, `maxValue`, `step`, `onChange` and `Slider.Track/Fill/Thumb`; verify installed API before writing code: https://heroui.com/en/docs/native/components/slider . Use existing Welcome RadioGroup patterns for languages.
- Profile tab uses existing tab bar. `/settings` remains a parent Stack route, can be opened from the app header, and returns to the source; avoid duplicate headers.
- Never invent account email, membership, verification, app build number, legal URL or sensor state. Show only available real data. Do not create inert links.
- App-owned UI text comes from en/ko/ja locale resources. Keep errors as message **keys** and translate when rendering.
- No changes to Google/API request flow, Expo sensor ownership, camera, map/directions, account security or database schemas.
- Keep changes in one focused PR, test first, commit after each coherent unit, never auto-merge.

## Existing code and proposed boundaries

| File | Responsibility |
| --- | --- |
| `src/features/settings/provider.tsx` (existing; preserve) | Source of persistent preferences and `save` operation. |
| `src/features/settings/preferences.ts` (existing; preserve) | Validation and preference types. |
| `src/features/auth/provider.tsx` (existing; preserve) | Signed-in user/session source. |
| `src/features/auth/sign-out-action.tsx` (modify narrowly) | Reuse existing sign-out operation, add optional HeroUI Settings appearance if needed. |
| `src/features/settings/profile-settings-content.tsx` (new) | One controlled content implementation for Profile tab and parent Settings route, with different header/Back configuration. |
| `src/features/settings/radius-control.tsx` (new) | Reusable accessible HeroUI Slider/preset/precise-input interaction, emits a single draft radius, independent of persistence. |
| `src/features/settings/settings-screen.tsx` (modify) | Small `/settings` route wrapper for shared content in stack context. |
| `src/features/navigation/profile-screen.tsx` (modify) | Small Profile-tab wrapper for shared content in tab context. |
| `src/features/navigation/app-tabs.tsx` (modify) | Hide redundant Profile tab header without changing other tabs. |
| `src/app/(app)/_layout.tsx` (modify) | Hide parent Settings native header; shared screen owns its one header. Preserve parent Stack and Back. |
| `src/i18n/locales/{en,ko,ja}.json` (modify) | Localized account, radius, language, statuses, About/version, device Settings and Save copy. |
| `global.css` (optional modify) | Reusable HeroUI component theme overrides only where approved design needs them; no duplicated hardcoded screen colors. |
| `src/features/settings/radius-control.test.tsx` (new) | Slider/preset/precise input contract. |
| `src/features/settings/settings-screen.test.ts` (update) | Current validation/locale regression using real new component boundary. |
| `src/features/settings/profile-settings-flow.test.tsx` (new) | Real settings provider and navigation/sign-out boundaries, mocked native/storage/Supabase only. |
| `src/features/navigation/app-shell.test.tsx` (update) | Header and tab route assertions on installed navigator. |
| `docs/design/clean-explorer/PROFILE_SETTINGS.md`, `docs/validation.md` (create/modify) | Approved deviations, test evidence and manual Android checks. |

## Review focus — high-risk failure modes and corresponding tests

1. **Returning to settings with an unsaved draft:** editing a preset or locale must not silently persist; navigation/Back and reopening show authoritative saved values (Task 3).
2. **Partially entered or invalid numeric radius:** a blank/decimal/out-of-range field must not call `save`; a valid non-preset integer like 123 remains unchanged after Save and reopening (Task 2/3).
3. **Concurrent save and failure:** double-tap must result in one write, promise rejection retains draft and shows localized retryable error, and a successful retry shows success only after completion (Task 3).
4. **Switching language while an error is present:** error message must update with the new committed locale; draft locale selection must not translate the rest of the app prematurely (Task 3/4).
5. **Sign-out and route context:** protected navigation must go to Sign In after successful logout; failed logout keeps current session with localized error; Android Back from `/settings` returns to previous tab; neither screen starts sensors/paid Google requests (Task 1/4).

---

### Task 1 — Shared route composition and navigation

**Files:** Create `src/features/settings/profile-settings-content.tsx` skeleton. Modify `src/features/settings/settings-screen.tsx`, `src/features/navigation/profile-screen.tsx`, `src/features/navigation/app-tabs.tsx`, `src/app/(app)/_layout.tsx`, `src/features/navigation/app-shell.test.tsx`.

**Interfaces:** Produce `ProfileSettingsContent({ entry }: { entry: 'tab' | 'stack' })`. `ProfileScreen` renders `entry='tab'`; the existing `/settings` screen renders `entry='stack'`. Stack entry offers Back via Router (fallback to Explore on a direct entry); tab entry does not add a fake Back. Both render the same content.

- [ ] Write a failing navigator/component test: three tabs remain Explore, AR, Profile; Profile content is mounted in Profile; `/settings` remains a protected parent Stack route; exactly one page header is present in each; parent Settings and tab Profile native headers are not duplicated; Back preserves tab state.
- [ ] Run `npx vitest run src/features/navigation/app-shell.test.tsx`; confirm these new assertions fail on the old placeholder.
- [ ] Implement the minimal shared component and wrappers. Keep existing map/AR route names, tab persistence and root auth/onboarding guards.
- [ ] Rerun the focused test; verify it passes. Check `git diff --check` and `npm run typecheck`.
- [ ] Commit: `feat(settings): share profile and settings screen across routes`.

### Task 2 — Account summary, language rows and radius control

**Files:** Create `src/features/settings/radius-control.tsx`, `src/features/settings/radius-control.test.tsx`. Extend `src/features/settings/profile-settings-content.tsx` and locale JSON files.

**Interfaces:**
- `RadiusControl({ value, onChange, disabled, invalid }: { value: number; onChange: (value: number) => void; disabled?: boolean; invalid?: boolean })` for valid controlled values, with additional precise input affordance able to represent every integer 10–1000 without coercing an existing non-preset value.
- `ProfileSettingsContent` reads signed-in email from `useAuth().session?.user.email`; never a hardcoded preview user. Its draft includes radius, locale, validation/error keys.

- [ ] Write failing tests for HeroUI Slider existence with `minValue=10`, `maxValue=1000`, and integer `step=1` (or an equivalent precise-entry strategy without value loss). Assert presets exactly 50/100/200/500; interacting with slider/preset/precise entry updates one displayed value. Test 10, 100, 123, 1000 as valid and 9, 1001, blank, decimal as invalid/no-save.
- [ ] Run `npx vitest run src/features/settings/radius-control.test.tsx`; see new tests fail before implementation.
- [ ] Implement the real HeroUI Slider and RadioGroup with UniWind styling. Reuse CJK/selection patterns from `welcome-screen.tsx`. Match approved screenshot hierarchy without inventing photo, version, permissions or signed-in status. Avoid new UI libraries.
- [ ] Rerun the focused tests, check typecheck, CJK copy layout logic and proper accessible labels/values.
- [ ] Commit: `feat(settings): add themed language and AR radius controls`.

### Task 3 — Explicit persistence and errors

**Files:** Modify `src/features/settings/profile-settings-content.tsx`, update `src/features/settings/settings-screen.test.ts`, create `src/features/settings/profile-settings-flow.test.tsx`. Do not replace `SettingsProvider.save`.

**Interfaces:** `draft: Preferences` + precise input state; derived `dirty`, `valid`, `saving`, `messageKey`; `save()` parses existing `preferencesSchema` and awaits **one** `settings.save(draft)` when valid. Abort duplicate taps and keep draft after a rejected save. Use `useSettings` for committed baseline; do not autosave when controls change.

- [ ] Write failing tests: selecting locale/radius does not write storage until Save; Save passes **both** preferences; while pending button disabled and only one call occurs; rejection retains draft and shows localized `settings.saveFailed`; retry succeeds, reports saved after promise resolves. Assert non-preset 123 persists, radius stays unchanged when only language edits; reopening without Save restores saved state.
- [ ] Run `npx vitest run src/features/settings/settings-screen.test.ts src/features/settings/profile-settings-flow.test.tsx` and see specific new failures.
- [ ] Implement controlled draft + validation + async submit with the same provider. Avoid calling `i18n.changeLanguage` directly in draft-change handlers. Avoid clobbering dirty edits on unrelated render.
- [ ] Rerun focused tests. Verify original error translation tests still pass under actual i18next resources.
- [ ] Commit: `feat(settings): preserve explicit save and recovery semantics`.

### Task 4 — Functional links, sign-out and route-safe presentation

**Files:** Modify `src/features/settings/profile-settings-content.tsx`, optional minimal `src/features/auth/sign-out-action.tsx` presentation variant, `src/features/settings/profile-settings-flow.test.tsx`, `src/features/navigation/app-shell.test.tsx` and locales.

**Interfaces:** Account info derives from `useAuth`, version derives from actual app config (`expo-constants`, if available), system Settings uses existing `SystemSettingsAction` behavior, sign-out invokes **existing** `SignOutAction` (optional UI variant) instead of calling Supabase directly from Settings.

- [ ] Write failing tests for real account email/initial, missing-email neutral fallback, missing-version graceful state, omitted legal link when no real URL, device Settings explicit action/error, sign-out busy/failure/success with protected navigation. Check Profile tab shows correct selected state and stack Settings shows appropriate Back.
- [ ] Run focused tests and confirm missing presentation/behavior before implementation.
- [ ] Implement the approved flat utility layout with HeroUI Card/Surface/Button, no faux verification/search/Saved features. Keep one header per entry, no tabs duplicated on stack route, and no fake click targets. Do not request permissions simply to display the screen.
- [ ] Run focused tests, `npm run check`. Verify no Google/Routes/location/camera calls on mount, focus, change language or radius; leave sensor owners untouched.
- [ ] Commit: `feat(settings): finish account and device settings actions`.

### Task 5 — Review, evidence and PR

**Files:** `docs/design/clean-explorer/PROFILE_SETTINGS.md`, `docs/validation.md`, relevant tests/labels or `global.css` if small approved corrections are needed.

- [ ] Compare native content/layout with approved `references/profile-settings-stitch.png`, recording deliberate deviations: Save action, real account/metadata, no inert legal/search/Saved links, no profile verification feature, optional version. Document that visual design isn't an authorization to fabricate data.
- [ ] Exercise large-text + small-height mocked layout; run whole suite with `npm run check`, `npx expo install --check`, `npx expo-doctor`, `npm run check:android`, `npm run export:android` and `git diff --check`. Report actual outputs; do not claim native APK or physical-device checks without executing them.
- [ ] Record manual Android checklist: Profile tab/stack Back, TalkBack slider and precise input, 150% text, English/Korean/Japanese, rapid slider/preset/Save, persistence/restart, denied/revoked system permission behavior, account email, sign-out failure/success, bottom gestures/three-button insets, zero Google provider requests.
- [ ] Independent review of new UI + original settings persistence code; resolve verified concerns and rerun tests. Update `AGENTS.md` only if a lasting architecture rule emerged.
- [ ] Commit: `docs(settings): record Clean Explorer acceptance and validation`.
- [ ] Push `feat/profile-settings-ui` and create a **reviewable PR against `main`**, explicitly **unmerged**; report commit list, verification and known device/content gaps.

## Plan self-review

- Scope: one shared Profile/Settings flow only, no additional features or backend dependencies.
- Lifecycle: the tab and parent Stack see one shared preference provider; route state and Back are testable.
- Precision: non-preset radius 123 must survive; state validation uses existing schema; no duplicate language source.
- Content: screenshot's fictitious email/status/version/legal terms are excluded or derived from real state.
- Safety: explicit Save, proper sign out, no new sensor activity/provider costs.

## Execution handoff

Owner-approved overall UI direction and prior first-pass persistence decisions are already documented. **Review this focused plan before delegating.** Recommended execution: have your current coding agent implement the five tasks sequentially with coherent commits and a final independent review; return the resulting unmerged PR for inspection, then begin integrated Android/UAT work.
