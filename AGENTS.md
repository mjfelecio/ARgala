# ARgala agent operating manual

ARgala is an Android-only travel discovery app built with Expo SDK 57 and strict TypeScript. It combines Google-powered discovery around arbitrary coordinates, walking route display, and GPS/compass camera-overlay AR. Prioritize mobile performance and Android-supported APIs. AR means camera overlays, not ARCore, spatial tracking or a 3D engine.

## Project sources and scope

- [Architecture and foundation requirements](docs/superpowers/specs/2026-10-17-argala-design.md) record the supplied briefs and approved architectural decisions.
- [Foundation implementation plan](docs/superpowers/plans/2026-10-17-argala-foundation.md) records the task boundaries.
- [Discovery extension guide](docs/extending-discovery.md) explains future curated-catalog integration.
- [Backend setup](docs/backend-setup.md) and [validation evidence](docs/validation.md) describe configuration, checks and outstanding device work.
- The draft SRS is not checked into this repository. When it is supplied, reconcile it with the approved architecture; do not infer a nine-destination or Ormoc-only discovery restriction from the draft catalog.

General location-based discovery and a future curated tourist catalog must coexist. Accept arbitrary search centers, including future selected-destination coordinates. Keep catalog ownership and verified tourist content in a future destinations feature; do not add a comprehensive POI database, admin portal or turn-by-turn navigation to the foundation.

## Architecture and data boundaries

- Keep feature code in `src/features/`; route files only assemble screens. Screens consume typed services; Google-specific request/response mapping stays behind provider boundaries. Pure geographic calculations must not import device APIs.
- Preserve provider identifiers unchanged. Base identifier length checks on documented provider constraints or shared application payload budgets; enforce complete request limits before quota consumption or provider work.
- Use React context for authentication/preferences, TanStack Query for transient server state, and React Native `StyleSheet` for presentation. Reuse the existing stack before adding dependencies.
- Google Places and Routes web-service calls must go through authenticated Supabase Edge Functions. Keep server credentials in Edge secrets. The public Android Maps SDK key belongs in native configuration with package/SHA restrictions; it is distinct from server keys.
- Preserve Edge authentication, schema validation, payload/result/radius limits, field masks, timeouts, sanitized errors and the atomic PostgreSQL request limiter before paid provider calls. See backend setup for deployment details.
- Do not persist provider results to disk or add POI/location-history/camera-frame storage. Clear transient query data on authentication changes. Display provider attributions and walking warnings with the relevant content.
- Run location/heading watchers and camera preview only while focused and foregrounded; clean up asynchronous subscriptions even if setup finishes after unmount. Track continuous watcher health separately from the last valid position. A one-shot fix cannot clear a watcher failure.
- Read foreground state through the shared subscription-consistent snapshot; a screen must not require another background/foreground event to start its sensors. Bound the complete focused location startup, including permission and service checks, and retire timed-out attempts so late native results cannot restart them.
- Keep separate concepts separate: nearby discovery defaults to **1000 m**; AR activation defaults to **100 m** for all POIs and is a device-local preference; a future destination-centered establishment radius (for example **500 m**) belongs to the catalog feature. Device-local activation is not a centrally managed setting for all users. Limits live in `src/config/limits.ts` and shared server contracts.
- Paid Places/details/routes requests require an explicit user action: Search, POI selection or Walk. Mounting, refocusing, foreground return, language changes and query invalidation must not silently initiate paid requests. Discovery starts with Search. Any future movement-triggered refresh needs a deliberate distance/cost policy.
- Never fabricate tourist descriptions or verified preview assets.

## Internationalization and error contracts

- Keep all app-owned display copy in `src/i18n/locales/`: labels, validation, alerts, loading/empty states, permission guidance, success messages, errors and fallbacks. Partial Korean/Japanese translations may fall back to English through i18next. Product/proper names, language autonyms and provider-attributed content may remain data values.
- Services and native/provider adapters preserve stable error codes. Map recognized failures to feature-owned codes or keys; account for both rejected setup promises and later error callbacks. Use SDK error types/codes rather than parsing English message text.
- Translate at the UI boundary. Raw native, SDK and server `error.message` values are diagnostic data and must never become display copy, including in generic fallbacks. Unknown failures use a feature fallback such as `location.unavailable`, `service.failed` or `auth.failed`.
- Keep message keys or error codes in state and call `t()` during rendering so visible messages follow language changes. New or changed error paths need English, Korean and Japanese resources for their known cases and generic fallback.
- Follow the existing error contracts in [location](src/features/location/errors.ts), [Edge requests](src/lib/edge-error.ts) and [authentication](src/features/auth/errors.ts). Extend the relevant contract when adding failure cases.

## Development and Git workflow

- Make small, reviewable changes with a clear success criterion. Inspect the relevant flow and current documentation before editing; avoid unrelated refactors or new libraries just to imitate another project's stack.
- Add focused regression coverage for behavioral fixes. Exercise the real hook/screen/service while mocking native or network boundaries; demonstrate the reported failure before the fix.
- Lifecycle regressions must exercise the installed SDK's focus hooks and delayed navigation readiness when those gates affect startup. Replacing a focus hook with a plain effect can hide a screen that never starts its sensors or deadline. Keep development diagnostics free of coordinates, credentials and raw native errors.
- Verify review findings against code and behavior. When a finding exposes a shared failure pattern, inspect sibling producers and UI consumers and fix confirmed instances together. Record lasting architecture rules here; keep feature details in code and tests.
- Validate each coherent change before committing. Use Conventional Commit subjects; include a concise body when motivation or material behavior needs explanation. Preserve incremental history and never merge a PR unless asked.
- Report exactly which checks ran and what remains unverified. Update validation evidence when behavior or coverage changes. Keep credentials and local environment files out of Git.

## Verification

Run lint and typecheck before declaring any task done. `npm run check` runs both plus the Vitest suite. Run targeted regressions during development, then the full check for the completed change.

Localization regressions must exercise actual locale resources and the real error-to-UI path, covering known errors, unknown fallbacks, recovery and language changes where relevant. Use actual SDK error classes when their shape affects mapping. Query lifecycle/cost tests must use the defaults from `src/lib/query.ts` and cover refocus, foreground return, remount and failure recovery; an infinitely fresh test cache can hide repeated paid calls.

For Edge changes, also run `npm run check:edge` and `npm run lint:edge`; run `npm run test:limiter` when limiter behavior or migrations change. For native configuration or SDK changes, run `npx expo install --check`, `npx expo-doctor`, `npm run check:android` and `npm run export:android`. The PR workflow repeats these checks, including the isolated PostgreSQL test.

Typechecks, mocked component tests, configuration introspection and Metro/Hermes exports are distinct from an APK build or physical-device verification. Never claim working GPS, compass, camera, Maps or live Google/Supabase integration without actually testing them. Before client demonstration/UAT, build and install a real Android APK with configured providers and field-test permissions, maps, GPS, camera, headings and routes. Record the device, configuration, scenarios and results.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
