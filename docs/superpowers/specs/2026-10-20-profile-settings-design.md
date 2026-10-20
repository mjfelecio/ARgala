# ARgala — Profile & Settings (S01) Design Specification

**Status:** implemented for PR review; Android device acceptance remains pending.
**Baseline inspected:** `mjfelecio/ARgala` `main` at `3a3f7708fcfbea992699094bb9bc46bff9981268` (20 October 2026). PR #15 is merged.
**Visual reference:** `../../design/clean-explorer/profile-settings/references/profile-settings-stitch.png` and `../../design/clean-explorer/profile-settings/references/profile-settings-stitch.html`, copied from the owner-approved Stitch export.
**Existing authority:** `AGENTS.md`, `docs/design/clean-explorer/SCREEN_SPECIFICATIONS.md` (S01), existing `SettingsProvider`, the app's actual auth/session state, and the confirmed client requirements. Generated Stitch data are visual samples, not factual app data.

## Goal and scope

Replace the Profile tab placeholder and basic Settings form with **one shared, functional Profile & Settings experience**. Keep the existing settings deep link and header entry point. This is the final screen-presentation slice, **not** a new profile service or a change in authentication, permissions, search, AR, or navigation architecture.

### Supported navigation

- **Profile tab** displays the full Profile & Settings interface, with the Profile tab highlighted and its normal bottom navigation present.
- **`/settings`** displays the **same functional content** from the parent stack, without an additional tab bar or duplicated header. Its Back control returns to the originating tab/screen, with a safe Explore fallback for a direct-link entry.
- Disable the normal tabs' built-in Profile header and the native `/settings` Stack header only insofar as needed to render **one** compact in-content header per presentation. Do not restyle the unrelated Explore/AR headers.
- Preserve Android Back, protected routes and the existing `router.push('/settings')` entry points. Do not create parallel preference stores or duplicate settings pages.

## Approved visual hierarchy

1. **Compact Profile & Settings header.** Green/mint white-native styling, no fake search action or unsupported profile editor.
2. **Account summary.** Actual Supabase account email, avatar initial derived from that email if available, otherwise neutral user icon; 'signed in' only when true. No invented full name, verification status, photo or travel stats.
3. **Language choice.** Exclusive English / 한국어 / 日本語 rows, matching Welcome's accessible HeroUI RadioGroup styling. These update the draft, **not the global locale until Save**.
4. **AR & Location.** Single user-facing 'AR activation radius' with a **HeroUI Native Slider** (v1.0.10), discrete 50 / 100 / 200 / 500 m presets, current value text and an accessible numeric entry/equivalent for precise 10–1000 m integer values. Controls share one draft value. Explain this is a **device-local radius for expanded POI information**, not GPS sensitivity and not the Google Places discovery radius or destination-centered 500 m establishment filter.
5. **Open Device Settings.** Explicit Android system settings link with localized failure handling; **does not** request sensor permissions automatically.
6. **About ARgala / App Version.** About may show a short static localized explanation; display actual configuration-provided version if present, otherwise omit the version value or show a localized 'unavailable'. Do not display mock v1.4.2/Build 240. Omit Terms/Privacy links until an approved real URL is configured; do not create inert buttons or fabricated legal documents.
7. **Save settings** with clear disabled/dirty/saving/success/failure states. Explicit Save is a previously approved product decision even though it is absent from the Stitch image.
8. **Sign Out** as a restrained action; reuse `SignOutAction` and the existing Supabase sign-out/error flow, not a new logout implementation.

### Styling

- Use installed **Expo SDK 57 / UniWind / HeroUI Native v1.0.10 / Plus Jakarta Sans / Ionicons**.
- `global.css` remains authoritative for approved Clean Explorer palette and component tokens: primary `#247A53`, strong green `#174D38`, mint `#E7F4EC`, white `#FFFFFF`, ink `#1C2923`, route blue reserved for mapping.
- Prefer HeroUI `Surface`, `Card`, `RadioGroup`, `Slider`, `Button`, and available accessible input primitives. Do **not** draw a slider, radio or buttons manually from plain rectangles. Use `className` rather than adding a new TypeScript theme file; restrict native styles to unavoidable dynamic/native cases.
- Keep one vertically scrollable screen, no hero photo, no floating/draggable bottom panel. Content paints through Android insets. Support small phones, TalkBack, Korean/Japanese glyphs, and enlarged text.
- Reproduce the structure of the approved screenshot, **not** literal fake data, nonfunctional icons, profile tiers, user location/GPS telemetry, sample version, search in Settings, or Saved tab.

## Data and behavioral contract

`src/features/settings/preferences.ts`: **existing** strict `Preferences = { language: 'en'|'ko'|'ja'; activationRadiusMeters: integer 10..1000 }`. Default radius **100 m**; **1000 m** is an independent discovery default.
`src/features/settings/provider.tsx`: **existing** `useSettings()` and `settings.save(value: Preferences): Promise<void>`, backed by `argala.preferences.v1` and i18next. Continue to use this atomic pair-save; never introduce a second persistence path.
`src/features/auth/provider.tsx`: **existing** `useAuth().session` is the account source.
`src/features/auth/sign-out-action.tsx`: **existing** sign-out semantics and translated error contract remain authoritative.

- Initialize an editable draft **once per current settings context** from loaded preferences; synchronize after a confirmed save and on external changes only when no unsaved edits exist. Avoid clobbering changes on unrelated component rerenders or locale updates.
- Radius slider, visible value, exact-entry control and presets stay synchronized. Clamp/validate on explicit selection rather than masking invalid keyboard entries. Preserve valid non-preset values, such as 123 m, through load/save/reopen.
- Validate with the existing `preferencesSchema`; enforce inclusive 10 and 1000 boundaries. Do not persist decimal/NaN/out-of-range values.
- Call **one** existing `settings.save({ language, activationRadiusMeters })` on each explicit Save press; ignore rapid repeat presses while saving. Show success **only after** the promise resolves; show a translated error and keep the draft on failure. Recover through another explicit Save. Do not implement autosave.
- A successful language change updates visible translations through the existing i18next context; uncommitted language switches must not prematurely mutate global settings. Retain error/message keys in state and translate during render.
- `SettingsProvider.storageError` stays visible as a localized notice without lying that settings were read correctly.
- Screen mount, language/radius draft changes, tab navigation, app foreground and button rendering must not call Google Places/Routes, start GPS/camera watchers, or request native location/camera permissions.
- Account changes continue to invalidate user provider cache through `AuthProvider`; settings UI must not create account caches.

## Acceptance and device checks

- Profile is a working settings surface; `/settings` is functionally the same; there is no duplicated title/header on either route.
- Existing configured preferences and selected language survive navigation/restart, including a non-preset radius.
- Slider, numeric input and presets remain synchronized; every valid integer in 10..1000 remains representable; invalid draft cannot save.
- Selecting `ko`/`ja`, saving, and returning/restarting displays corresponding app-owned strings; failure preserves draft, retries, and does not display premature success.
- Sign out invokes the real existing auth flow; errors are localized, and protected navigation returns to Sign In without user data leaking through old pages.
- Account email is real or gracefully absent; version is real or absent; legal links are real or omitted; no fake search/Saved/verified badge.
- Android TalkBack slider/entry/selection, 150% text, keyboard open, small screen and bottom gesture/three-button navigation must be **device-validated**. CI/Metro export alone are not device UAT.

## Deliberately deferred

Profile editing, avatar upload, remote admin-managed radius, analytics, Saved/bookmarks, social logins, automatic AR permission flows, cloud preference sync, legal document creation, sensor algorithm tuning, and broad UI refactors. Next phase after screen completion is end-to-end Android field testing, integration and optimization.
