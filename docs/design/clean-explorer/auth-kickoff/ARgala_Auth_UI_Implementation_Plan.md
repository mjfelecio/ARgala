# ARgala Sign In & Create Account UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the existing ARgala email/password Sign In and Create Account screens to match the approved Stitch references while preserving all current auth behavior.

**Architecture:** Keep a single existing `/sign-in` route and its local `registering` mode. Extract only shared visual elements that are genuinely reused: a scenic hero presentation and HeroUI credential fields. Current Supabase submission and session providers remain authoritative; inputs are controlled locally, and translated message keys are rendered by i18next.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, Expo Router, HeroUI Native 1.0.10, UniWind 1.12.2/Tailwind v4, `global.css`, Ionicons, i18next, Supabase Auth, Vitest.

**Spec:** `docs/design/clean-explorer/SCREEN_SPECIFICATIONS.md` (AU01/AU02) and the enclosed `ARgala_Auth_UI_Design_Spec.md`. Selected screenshot/HTML references are included in `references/`.

## Global Constraints

- Work from latest `main` of `mjfelecio/ARgala`; baseline at authoring `84d1deeb` and PR #14 is merged. New branch `feat/auth-clean-explorer-ui`.
- Preserve `/sign-in`, `Stack.Protected`, Welcome completion, and Supabase auth session restoration.
- Only email/password authentication; no new auth provider, profile schema, backend, or data retention.
- Single source of design tokens `global.css` with `#247A53`, `#174D38`, `#E7F4EC`, `#FFFFFF`, and `#1C2923`; no TypeScript theme duplication.
- Prefer actual HeroUI `TextField`/`Input`/`Label`/`Button` and UniWind `className`. Confirm installed exports before coding; do not assume web-only `@heroui/react` API.
- Registration is **8–128** password characters; sign-in accepts any **nonempty** password. Trim only email, never password; use existing schemas.
- Do not show fake default credentials, signup success without session, invalid auth details, fake photo content, or fake supported login methods.
- The lower white content surface extends to the bottom safe area, is never a floating card, and scrolls on small/keyboard-open Android.
- No native dependency changes without a justification and SDK-compatible install. Keep coherent Conventional Commits, focused test red→green and independent PR review; do not merge.

## Review Focus

1. **Credential normalization:** `email=' user@example.com '` trims while `password=' space '` is sent unchanged. Test in Task 3 using the real schemas.
2. **Different password rules:** six-character password can sign in but cannot register. Test in Task 3.
3. **Authentication races:** repeated button presses during pending async operation lead to at most one Supabase call. Test in Task 3.
4. **Error/confirmation handling:** sign-up without session keeps user unauthenticated and gives localized confirmation/re-entry path; SDK raw error never leaks. Test in Task 3.
5. **Android layout/accessibility:** short viewport, large text, keyboard, password toggle, and CJK labels retain reachable actions. Add component tests in Tasks 2/4 and record manual Android verification in Task 5.

---

### Task 1: Prepare reference-aware, reusable scenic authentication presentation

**Files:**
- Read: `src/features/onboarding/welcome-screen.tsx`, `src/features/auth/sign-in-screen.tsx`, `global.css`, `docs/design/clean-explorer/SCREEN_SPECIFICATIONS.md`.
- Create (if extraction justified): `src/ui/scenic-landscape.tsx`.
- Modify (only if extracting): `src/features/onboarding/welcome-screen.tsx`.
- Test: relevant `src/features/onboarding/welcome-screen.test.tsx` and optional `src/ui/scenic-landscape.test.tsx`.

**Interfaces:** A visual-only `ScenicLandscape()` component, with no device permissions and no remote image/network access; preserve Welcome's existing output and allow authentication to use the same non-photographic fallback until approved assets exist.

- [ ] Inspect current Welcome landscape and confirm it is safe to extract without changing onboarding behavior. If not, avoid the extraction and document the intentional independent graphic.
- [ ] If extracting, add a regression test showing the existing Welcome hero remains rendered, selecting a language still works, and no new side effects are introduced. Run it and confirm it fails for the intended missing interface.
- [ ] Extract original SVG presentation into `src/ui/scenic-landscape.tsx` and reuse in Welcome without altering the current screen's layout/permissions/persistence.
- [ ] Run focused Welcome tests, `npm run typecheck`, `npm run lint`. Review diff and commit `refactor(ui): share scenic branding for welcome and auth` (only if extraction occurs).

### Task 2: Build coherent HeroUI credential form controls

**Files:**
- Create: `src/features/auth/credentials-fields.tsx`.
- Create: `src/features/auth/credentials-fields.test.tsx`.
- Possibly modify: `global.css` for focused Input/TextField component overrides only when current documented semantic defaults cannot match Stitch.

**Interfaces:**

```ts
export type CredentialsFieldsProps = {
  email: string;
  password: string;
  registering: boolean;
  disabled: boolean;
  onEmailChange(value: string): void;
  onPasswordChange(value: string): void;
  invalidEmail?: boolean;
  invalidPassword?: boolean;
};
export function CredentialsFields(props: CredentialsFieldsProps): React.JSX.Element;
```

- [ ] Inspect installed `heroui-native@1.0.10` component exports and official native TextField/Input documentation. Do not import React web components.
- [ ] Write failing component tests asserting one controlled email input, one controlled password input, equivalent visual variants in both modes, labeled fields, correct Android email keyboard props, disabled state and an accessible show/hide-password button.
- [ ] Run `npx vitest run src/features/auth/credentials-fields.test.tsx` and confirm failures reflect missing behavior.
- [ ] Implement with HeroUI `TextField`, `Label`, `Input`, `Description`/`FieldError` as appropriate and Ionicons. Password visibility is UI-only; toggling it must not alter the password value or trigger submit. Registration helper conveys **8 characters minimum**.
- [ ] Rerun focused tests and relevant `npm run typecheck`/`npm run lint`. Commit `feat(auth-ui): add shared HeroUI credential fields`.

### Task 3: Preserve and verify the real authentication workflow

**Files:**
- Modify: `src/features/auth/sign-in-screen.tsx`.
- Modify: `src/features/auth/auth-errors.test.ts` to use real new form composition/native mock boundary.
- Test: `src/features/auth/credentials.test.ts` and focused `src/features/auth/auth-ui-flow.test.tsx` (new).

**Interfaces:** Same Supabase calls, existing schema and `authErrorMessageKey`, two visual modes within one route. On successful login, Supabase session update drives protected navigation; on successful sign-up without session, show `auth.confirm`. Use a synchronous submission guard in addition to disabled UI to prevent duplicate requests.

- [ ] First write/adjust behavioral tests for invalid email, empty passwords, 6-char sign-in vs 8-char registration, unchanged password contents, pending submit guard, sign-up-no-session confirmation, known/unknown auth errors, mode switch and translated errors after a language change.
- [ ] Run targeted tests and confirm intended failures are observable prior to implementation (do not accept a failing mock as behavioral proof).
- [ ] Replace old `Field`/`Action` presentation with `CredentialsFields` and HeroUI Buttons, preserving current `registrationSchema`, `signInSchema`, Supabase error mapping and clearing password on successful submit only.
- [ ] Ensure selected mode and error state aren't accidentally reset by a normal language change, and no raw SDK message is rendered.
- [ ] Rerun focused tests then `npm run check`; commit `refactor(auth-ui): preserve Supabase flow with themed forms`.

### Task 4: Implement full-height auth screen and locale-safe presentation

**Files:**
- Modify: `src/features/auth/sign-in-screen.tsx`.
- Modify: `src/i18n/locales/en.json`, `ko.json`, `ja.json` only for genuinely new copy.
- Test: `src/features/auth/auth-ui-flow.test.tsx` (extend).

**Interfaces:** Single responsive screen with an upper scenic region and lower white full-height content section. Distinct titles/CTA by mode, same form component and primary button hierarchy. React Native safe areas, keyboard handling, and accessibility appropriate for Android. Avoid a back button unless it has a meaningful destination: completed onboarding cannot simply be reopened on every press.

- [ ] Write failing tests for mode-specific headings/CTA, action labels, keyboard scroll container, lower white content extent, no bottom tab bar, no mock account email and English/Korean/Japanese resource availability.
- [ ] Implement consistent upper hero and a full-height white lower surface; use UniWind and semantic tokens, HeroUI Surface/Button; no WebView or CSS-generated static form screenshot. Allow long translated text and system font scaling.
- [ ] Keep inline switch visible/scrollable; show a translated confirmation state after sign-up that requires email confirmation. Any decorative photo remains a branded local fallback unless supplied/approved with credits.
- [ ] Rerun targeted tests, `npm run check`, then commit `feat(auth-ui): match Clean Explorer authentication layouts`.

### Task 5: Native validation, docs and PR review

**Files:**
- Create: `docs/design/clean-explorer/AUTHENTICATION.md`.
- Modify: `docs/validation.md`, optionally `AGENTS.md` only for lasting rules (not duplicated feature-specific prose).
- No new native config by default.

- [ ] Compare both app states against included approved PNGs at realistic Android logical sizing; record deviations rather than invent perfect parity.
- [ ] Run `npm run check`, `npx expo install --check`, `npx expo-doctor`, `npm run check:android`, `npm run export:android`, `git diff --check`. Record exact pass/fail results; do not claim an APK built from an export.
- [ ] If a configured Android device is available, test keyboard open on both screens, show/hide password, 150% font scale, CJK glyphs, submit double-tap, sign-up/no-session confirmation, session restore/back, account mode switch and error recovery. Report explicit untested items otherwise.
- [ ] Confirm protected Welcome flow and app tab routes unaffected, no new paid provider calls, and no unlicensed/mock photography used in runtime.
- [ ] Document architecture, tested scenarios and remaining APK/UAT work. Commit `docs(auth-ui): document visual and functional validation`.
- [ ] Push `feat/auth-clean-explorer-ui` and open an unmerged PR against `main`, summarizing exact tests, side effects, and Stitch mismatches. Request independent review. Do not merge.

## Execution handoff

Implement this plan via the user's existing coding agent. Work only on this one screen flow; stop and report actual incompatibilities rather than replacing the library or rewriting auth infrastructure. Preserve incremental commits. Once the PR is reviewed/merged, the next scheduled screen is Profile & Settings, then end-to-end outdoor UAT and optimization.
