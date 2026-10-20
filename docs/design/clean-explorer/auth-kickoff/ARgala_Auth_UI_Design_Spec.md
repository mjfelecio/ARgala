# ARgala — Authentication UI Design Specification

**Status:** Approved visual references; scoped implementation proposal. 2026-10-20.
**Repository baseline inspected:** `mjfelecio/ARgala` `main` at `84d1deeb49e4cc8f1ea3bfbd0d588ad6c93cf3e5` (PR #14 merged). Agent must inspect the latest actual `main` when starting.
**Source of design:** owner-approved `argala_sign_in_refined` and `argala_create_account_refined` Stitch exports (PNG and HTML included under `references/`). Both PNGs are valid 706×1600 images; HTML is reference only. Grounded in `docs/design/clean-explorer/SCREEN_SPECIFICATIONS.md` AU01/AU02 and `DESIGN_SYSTEM.md`.

## Intent and scope

Redesign **only** the authenticated gateway's unauthenticated **Sign In / Create Account** presentation, preserving Supabase email/password behavior, credentials validation, translations and protected Expo Router routes. This is an existing functional flow restyle, not a new auth provider, backend, or onboarding subsystem.

### The required composition

- Two modes on the **existing `src/app/sign-in.tsx` route**, controlled by the existing screen's sign-in/register state. No duplicate auth-route architecture.
- Upper scenic region: approximately a quarter to a third of initial portrait viewport, ARgala identity and small back affordance **only if it has a valid navigation destination**. Match Welcome's green/mint visual identity. Existing welcome uses an original abstract landscape; it may be reused/extracted as a shared visual. Do not remotely fetch the generated Stitch image, impersonate a verified photo of Lake Danao, or add unlicensed media.
- Lower region: continuous **white surface from the hero overlap through the bottom Android safe area**, soft rounded top corners, no fake mint gap, no isolated floating card, no drag handle, no bottom tab navigation.
- Sign In: “Welcome back”, subtitle, labeled Email + Password, main green Sign In button, inline “Create an account” switch.
- Create Account: “Start exploring”, subtitle, the **same** input components, main green Create Account button, inline Sign In switch, registration minimum-eight-character helper.
- Consistent white inputs with subtle borders, accessible focus/error state, password visibility toggle with accessible label, Plus Jakarta Sans/CJK fallback; green `#247A53` main action, `#174D38` strong text, `#E7F4EC` mint, `#FFFFFF` surface, `#1C2923` ink, all read from `global.css` and existing semantic tokens.
- Layout must scroll and remain functional on a shorter phone, 150% Android font, opened keyboard, and English/Korean/Japanese translations.

### Existing behavior to preserve (checked in repository)

- `src/features/auth/sign-in-screen.tsx`: same email/password login/registration actions via `getSupabase().auth.signInWithPassword` and `signUp`. Preserve switching between modes and clearing stale errors on mode switch.
- `src/features/auth/credentials.ts`: email is **trimmed**; the password must remain byte-for-byte unchanged; sign-in accepts a nonempty password (even shorter than 8); registration requires 8–128 characters. Do not validate sign-in with the registration rule.
- `src/features/auth/errors.ts`: known Supabase auth error **codes** become stable message keys; unknown errors show localized fallback. Never display raw SDK/provider messages. Existing account/error mapping is a pre-existing behavior; do not quietly change information-disclosure policy in a visual PR.
- Registration with `data.session === null` displays the translated confirmation-email guidance; user can switch back to Sign In. Do not treat this as a signed-in success.
- `src/features/auth/provider.tsx`, `src/features/navigation/root-navigation.tsx`, `src/features/onboarding/provider.tsx`: session restoration, auth guards, first-launch flow and post-onboarding behavior remain intact. Sign-in completion is driven by **actual session state**, not by pressing a button.
- Error/loading/status messages are translated at render time from existing `src/i18n/locales/en.json`, `ko.json`, `ja.json` resources. Extend resources only for truly new UI labels; do not add a second auth localization store.

### Preferred implementation technology

- Use current **HeroUI Native 1.0.10** form primitives where supported (`TextField`, `Label`, `Input`, `FieldError` / `Description`) and its `Button` instead of custom styled `TextInput` and RN `Button`. Confirm installed version/import paths from local package and official version-compatible docs before coding.
- UniWind utilities on native components; `global.css` remains the one source of theme tokens. `StyleSheet` only if warranted for intrinsic/native layout mechanics. Avoid a second TypeScript theme file or handmade generic button/input library.
- An app-level `CredentialsFields` can compose HeroUI form components to avoid duplicating sign-in/create-account input styling. Reuse existing Ionicons for password toggle.
- No new API endpoints, databases, OAuth providers, account profile fields, photo asset service, caching, or telemetry.

### Explicit nonfeatures

No social login, password reset/forgot-password promise, guest entry, biometrics, full name/phone number/birthday, fabricated offline badge, extra welcome/onboarding screens, app-store release, or phantom functionality from Stitch HTML.

### Required states

Valid/empty/invalid email; empty password; shorter-than-eight sign-in vs signup; focused/visible and hidden password; busy submit/disabled repeated submit; network/Supabase error; registration email confirmation; language change while error visible; keyboard opened; auth mode switch; session restoration; small screen/CJK/150% text.

### Acceptance

The screens visually follow the refined Stitch exports at appropriate Android viewport sizes, keep one continuous lower white surface, use the installed HeroUI/UniWind system, provide testable accessible controls and retain the pre-existing auth/session behavior. Only the code paths above may change. Do not claim pixel parity or Android keyboard correctness without actual device evidence. Unit/component tests are not a real APK or UAT.
