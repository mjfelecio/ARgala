# ARgala — W01 Welcome & Language Selection Design

Status: **Approved visual direction; implementation proposal for first-launch behavior.**

## Authority and target

- Approved Stitch screen: `references/welcome-stitch-reference.html` (the corrected exported HTML). The original `screen.png` is an invalid 28-byte fetch error and is not a visual reference. The previously discussed screenshot is from an earlier version, not proof of the corrected screen's pixel layout.
- Source of feature scope: direct client conversations and Draft 1.0 SRS. When they conflict, the firsthand client requirements prevail. W01 adds language selection; it does not narrow Google Places discovery or the supported AR workflow.
- Approved Clean Explorer style: UniWind + HeroUI Native; centralized `global.css`; primary `#247A53`, stronger `#174D38`, mint `#E7F4EC`, white `#FFFFFF`, text `#1C2923`. Plus Jakarta Sans with CJK system fallback.
- Android-only, Expo SDK 57, protected Expo Router navigation. No new UI library, authentication provider, custom backend or camera/GPS access.

## User journey

1. **New installation / first unauthenticated use:** present Welcome once, with a scenic visual slot, ARgala branding, the exact tagline “Discover places around you.”, three language choices, and Continue.
2. **Choose language:** English / 한국어 / 日本語. Use accessible exclusive selection; default to current supported persisted language/device locale, falling back to English. Update welcome copy to match the highlighted language where translations exist.
3. **Continue:** persist the chosen language through existing `SettingsProvider.save` (preserving `activationRadiusMeters`), then persist a dedicated `argala.onboarding.v1` completion marker. Navigate to existing Sign In only on confirmed success. Disabled/busy/error state is visible; retry is possible. Never claim saved before both operations succeed.
4. **Returning unauthenticated user:** go straight to Sign In, not Welcome.
5. **Returning signed-in user:** go straight to the app. A missing onboarding flag must never log out, reset session or show a compulsory welcome page to an already signed-in user.
6. **Existing installations before W01:** do not surprise current users with mandatory onboarding. A preexisting `argala.preferences.v1` record or restored signed-in session counts as existing usage; mark this migration safely, and leave existing preferences unchanged.
7. **Sign out:** return to Sign In, not Welcome. Reinstall/clear storage is treated as new installation.

## Presentation

- Top: scenic hero/graphic area, ARgala wordmark and concise tagline. Use an **approved, locally bundled and credited** image only. If unavailable, show a deliberate branded mint/green fallback; the export's external Google-generated `lh3.googleusercontent.com/aida-public/...` URL is a *design reference*, not a production asset or verified Lake Danao photograph.
- Bottom: a full-height white content surface continuous to the bottom safe area, with softly rounded top corners; not a floating draggable sheet. No decorative drag handle, fake login form, duplicated logo, camera controls, or simulated Android status bar.
- Language rows: one selected at a time, with appropriate radio semantics, generous touch targets, legible Korean and Japanese glyphs. No national flags.
- Footer: full-width HeroUI primary Continue and small “You can change your language anytime in Settings.” note.
- Screen must scroll on smaller Android phones / 150% text; no clipped CTA, keyboard, or inset overlap. No bottom tabs on this screen.

## Behavioral boundaries

- Reuse the existing language schema (`en`/`ko`/`ja`), Settings preferences, i18next, and Supabase auth. Do not fork locale state into a separate persisted language preference.
- A completion flag is the only new durable datum. Store no telemetry, coordinates, account profile, travel history, images, camera frames or provider content.
- The Welcome screen must be available before a user is authenticated; the remaining private app routes retain their protection.
- Reading and interacting with Welcome must never request camera/location permissions or call Google Places/Routes/Supabase paid endpoints. Supabase session restoration remains as it is.
- No guest mode, social sign-in, onboarding slides, speech translation, extra form fields, or auto-translated source-provider content.
- Handle AsyncStorage read failure with a localized recovery/retry state; do not silently forget a completed onboarding and force the Welcome page in a loop.

## Acceptance

- Fresh unauthenticated install shows Welcome; Continue in each language persists the selection and lands on Sign In. Restart skips Welcome; post-sign-in opens normal app.
- Signed-in/legacy user skips Welcome with existing data unchanged; signing out doesn't re-open Welcome.
- Existing settings' radius survives selection, refresh, and restart.
- Failed preference or marker write does not leave the screen while claiming success. Retry eventually completes exactly once.
- Deep links to private destinations remain protected; authenticated users can still reach the normal screen.
- All three languages show correct checked state, translated copy where available, and usable CJK/large-text layout.
- No automatic provider calls or sensor permission prompts; current sign-in/session restoration, tabs, maps, AR and routes remain untouched.

## Known fidelity and content limitations

The corrected Welcome HTML has no valid paired PNG. It is useful for layout/typography, but exact screenshot parity cannot be asserted until an approved screenshot and actual Android comparison exist. Image licensing and genuine location provenance must be verified before production use. These do not block a functional first-pass welcome screen with honest fallback art.
