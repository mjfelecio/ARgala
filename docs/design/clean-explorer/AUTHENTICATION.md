# Assigned tester Sign In — 2026-11-15

The approved presentation plan supersedes the historical registration and Google
flows described below. `/sign-in` now uses the established Seafoam Forest hero,
white form surface and primary HeroUI credential fields for assigned email/password
accounts, with Guest as its secondary action. The form has one keyboard-avoiding
scroll owner, handled keyboard taps, password autofill/visibility and translated
EN/JA/KO tester instructions. The registration-unavailable notice sits beneath
Sign in; there are no registration, reset-password or Google actions.

Only email whitespace is trimmed; passwords retain their exact contents and any
nonempty existing password may sign in. A synchronous ref owns both login and
Guest entry while pending. Disabled fields/actions, error preservation, password
clearing after success and retired UI callbacks after unmount are covered through
the real screen with SDK boundaries mocked. Supabase codes map to translated
messages at render time; unconfirmed accounts receive developer-activation guidance.
Session restoration, logout, Guest persistence/merge and native dependencies/runtime
configuration retain their existing owners. Hosted provisioning instructions live
in [backend setup](../../backend-setup.md#assigned-tester-accounts-for-the-presentation).
Android keyboard, large text, assigned-account login/logout/reopen and preview OTA
cold launches require the physical A53; automated tests do not establish those.

---

Historical auth layout implementation (superseded where it conflicts above):

# AU01/AU02 — Sign In and Create Account

Implemented from the owner-supplied approved [design](auth-kickoff/ARgala_Auth_UI_Design_Spec.md), [plan](auth-kickoff/ARgala_Auth_UI_Implementation_Plan.md) and paired [Sign In](auth-kickoff/references/sign-in-screen.png) / [Create Account](auth-kickoff/references/create-account-screen.png) references. The supplied HTML is reference material only.

The existing `/sign-in` route owns both modes. `CredentialsFields` composes installed HeroUI Native TextField, Label, Input, Description and Button components. Both modes explicitly select the same primary white inputs, including on a HeroUI Surface (whose automatic input variant would otherwise become secondary). Android focus and error styles remain HeroUI's; the ordinary border uses the existing outline token. All colors and typography come from `global.css`.

The upper hero reuses Welcome's original abstract SVG, now extracted to `ScenicLandscape`. This extraction preserves Welcome's output and language behavior. It needs no remote image, permissions, device sensors or network. No photo is represented as a verified tourist destination. The lower white Surface grows to the bottom safe area, with rounded top corners and no floating mint gap. The whole page scrolls inside a keyboard-avoiding container, with handled keyboard taps and content that grows with text. Android keyboard and large-text correctness still require native UAT.

Mode-specific headings, supporting copy, CTA, password visibility labels, registration guidance, inline switch prompts and statuses use the existing EN/KO/JA locale resources. The reference's populated email is never shipped. The reference Create Account handle is omitted because this page cannot be dragged. The back affordance is omitted because completed Welcome is removed from protected history and has no valid return target. Typography uses the app's native logical-unit scale; 706×1600 reference pixels are not device-independent measurements. Photo parity and native screenshot parity are not claimed.

Supabase email/password submission still uses the existing schemas: only email is trimmed; password bytes are preserved; sign-in permits any nonempty password; registration requires 8–128 characters. A synchronous submission ref blocks repeated presses and mode changes until the request settles. Busy state disables both fields, the visibility toggle, CTA and mode switch. Failures preserve credentials; success clears the password. A no-session signup shows translated email-confirmation guidance and retains explicit return to sign-in. The actual session provider and existing protected root navigation remain authoritative. No provider, reset-password promise, account fields, guest entry or additional backend request was added.

Validation uses real HeroUI components and real i18next resources, with native and Supabase boundaries mocked. Auth regressions cover exact credential normalization, short sign-in/registration rules, invalid fields, duplicate presses in both modes, disabled controls, known/unknown SDK errors, error recovery, language changes, confirmation with no session, successful signup with a session, mode switches and no submit on mount/remount/language change. Existing Welcome, onboarding and protected-navigation coverage is retained. These tests inspect behavior and composition; they do not render Android layout or prove keyboard, glyph or TalkBack behavior.

Before client UAT, use a configured Android APK to review both screens against the PNGs at 360×800 and a short viewport; keyboard open/closed; 150% text; EN/KO/JA glyphs and wrapping; password visibility and autofill; rapid presses; offline error and retry; live signup with email confirmation; session restoration and Back/sign-out. Verify bottom system insets and TalkBack labels, busy state and status announcements. No APK or device test was performed in this environment.

See [validation evidence](../../validation.md) for exact check results and device limitations.
