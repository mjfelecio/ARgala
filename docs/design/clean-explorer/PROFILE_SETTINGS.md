# Profile & Settings — S01

Implemented from the owner's Profile & Settings kickoff on top of `main`
`3a3f770` (merged PR #15). The Profile tab and parent `/settings` route render
`ProfileSettingsContent` with one title each. Explore/AR chrome, authenticated
navigation and the original tab state remain owned by the existing navigators.
Stack Back uses history; a history-free entry falls back to Explore. Profile
retains the tab bar and lets that navigator consume the bottom inset; stack
Settings consumes its own bottom inset.

## Behavior

- `SettingsProvider.save` and `preferencesSchema` are unchanged. Preferences
  remain the device-local `argala.preferences.v1` language/radius pair.
- HeroUI RadioGroup selects English, Korean or Japanese in a draft. Committing
  Save changes the global locale through the existing provider.
- HeroUI Slider, 50/100/200/500 m presets and numeric Input share one radius
  draft. All integers from 10 through 1000 m, including 123, remain representable.
  Invalid keyboard text stays visible, with a translated error and disabled Save;
  slider position retains the last valid value. TalkBack receives actual meters
  and explicit one-meter increment/decrement actions rather than percentages.
- Save is disabled while pristine, invalid or pending. A synchronous guard
  suppresses rapid duplicate submissions. Success follows persistence completion;
  failure retains a visible draft for explicit retry. A new edit clears success.
- External saves refresh a pristine screen without overwriting dirty edits.
  Leaving a screen discards its unsaved draft, including when Profile stays
  mounted in the tab navigator. Already submitted saves can finish after departure;
  an unfocused/unmounted screen does not announce stale success.
- Account email/initial come from the real Supabase session. Missing email uses a
  neutral avatar and localized absence label. Version comes from
  `Constants.expoConfig.version`; missing metadata uses localized “Unavailable”.
- SignOutAction retains its Supabase operation/error mapping and adds an optional
  HeroUI appearance plus a synchronous duplicate guard. AuthProvider still owns
  cache clearing and the protected navigation transition.
- DeviceSettingsAction supplies HeroUI presentation to the existing
  SystemSettingsAction operation. Its optional render callback keeps icon/theme
  dependencies out of shared location status. Failure is translated inline and
  recoverable; other consumers retain their existing alert behavior.
- Settings creates no paid request authority, GPS/heading watchers, camera preview
  or permission request. AR activation remains independent of nearby discovery's
  1000 m default and the curated catalog's fixed 500 m radius.

## Appearance and intentional differences

The supplied [PNG](profile-settings/references/profile-settings-stitch.png) and
[HTML](profile-settings/references/profile-settings-stitch.html) remain design
references. HTML trailing whitespace was normalized. No rendered Android pixel
comparison has been performed.

The native implementation follows the mint/white utility layout: compact account
summary, language card, radius card, About/version, explicit Save and restrained
Sign Out. It uses existing `global.css` tokens, Plus Jakarta Sans, HeroUI Native
and UniWind; no dependency or alternate theme was added. Controls wrap and the
content scrolls with handled keyboard taps. No fixed viewport height is assumed.

Differences are deliberate: explicit Save/dirty state and precise numeric entry;
actual email/version; no verification badge, search action, Saved tab, GPS
sensitivity control or fabricated legal links. About is an informational section
rather than an inert navigation row. No account editing or cloud settings store
was introduced.

## Evidence and Android acceptance

See [validation evidence](../../validation.md) for exact commands and counts.
The integration tests exercise real HeroUI components, SettingsProvider,
AuthProvider, RootNavigation, installed Expo Router focus hooks and actual locale
resources. Native/storage/Supabase/navigation-renderer boundaries are replaced.
Tests cover save concurrency/recovery, non-preset persistence, invalid inputs,
external changes, tab abandonment, pending-save departure/unmount, account
absence, known/unknown sign-out errors, protected sign-in transition/cache
clearing, both route entries, device Settings recovery and no sensor/network
activity during local screen lifecycle events.

Physical Android acceptance is **pending**. Automated renderer tests do not run
Yoga, TalkBack, a keyboard or Android system bars; no small-screen or 150% font
layout fit is claimed. Before UAT, build/install a configured APK and record the
device/Android version, app configuration, scenarios and results:

- Open Profile from Explore; verify the active tab, single title and bottom bar.
  Open header Settings from Explore and AR-related contexts; Android Back restores
  the origin. Test a direct `/settings` link and its Explore fallback.
- Test TalkBack language rows, slider meter values/increment/decrement, presets,
  precise input, disabled/pending Save and success/error announcements. Verify
  touch targets, focus order and that decorative icons are not read as actions.
- At 150% font and on a small phone, inspect EN/KO/JA wrapping/glyphs, long account
  email, keyboard-open numeric input, Save and Sign Out reachability. Check gesture
  and three-button navigation, top cutouts and bottom safe areas.
- Save radii 10, 123 and 1000; restart and reopen both entries. Change only language
  and ensure radius survives. Navigate away without saving and verify abandonment.
  Exercise rapid slider/preset/Save, storage failure/retry and pending departure.
- Open Android device Settings after denied/revoked permissions and return. Verify
  that this page did not prompt for permissions or start location/camera sensors.
- With live Supabase, verify real account email, sign-out failure/retry/success,
  session restoration and inability to return to authenticated content after logout.
- Confirm zero Google Places/Routes requests for opening/editing/refocusing this
  page or returning from the background. Existing map/GPS/heading/camera/route
  field testing and destination content approval remain separate requirements.
