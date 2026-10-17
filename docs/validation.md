# Foundation validation

Local validation on 2026-10-17 used Node 22.19.0, Expo SDK 57.0.30, TypeScript 6.0.3, Vitest 5.0.5, Deno 2.9.6 and PostgreSQL 14. The existing ARgala root contains the project; no nested app or separate worktree was created.

| Check | Evidence/result |
| --- | --- |
| Lockfile installation | Clean `npm ci` completed after an interrupted registry download was diagnosed and recovered. |
| `npm run check` | Passed after PR #1 follow-ups: strict TypeScript, zero-warning ESLint, 50 tests across 15 files. |
| `npm run check:edge` | All three Edge entrypoints type-check under Deno. |
| Deno lint | Shared implementation and Edge handlers pass. |
| `npm run test:limiter` | Actual isolated PostgreSQL migration: 32 concurrent calls allowed 30/denied 2; privileges and window reset passed. No existing database was used. |
| `npx expo install --check` | SDK-compatible dependencies confirmed. |
| `npx expo-doctor` | 21/21 checks passed. |
| `npx expo prebuild --platform android --no-install` | Android native project generated successfully; required permissions and blocked audio/background location inspected. Generated native files stay ignored. |
| `npm run check:android` | Introspection validates SDK/platform/package, foreground/camera permissions, blocked audio/background permissions, native Maps key injection, and EAS APK profiles. Uses a nonfunctional process-local validation marker, not a real key. |
| Android export | Source including the latest request-control and timeout fixes passed Metro/Hermes export (1549 modules, 4.5 MB bundle). This is not an APK/native compilation. |
| Independent review | Confirmed Android camera API defect plus hidden permission-error recovery path. Both are corrected with focused regression checks; other application/service paths had no confirmed material findings. |
| Dependency audit | `npm audit --omit=dev` reports 30 transitive counted findings (19 high, 11 moderate, 0 critical), rooted in four advisories. See details below. |

The initial main scaffold was checked against the SDK 57 Router template manifests before its first commit. Full compiler/lint/test validation followed the recovered dependency installation on the implementation branch. The branch preserves each coherent unit and its validation in Git; no history was squashed.

## Test coverage and limits

Tests cover coordinate boundaries, finite inputs, Haversine/antipodal/dateline distances, geographic bearing, heading normalization/relative angles, inclusive radius checks, late native subscription cleanup, auth credential normalization, public environment validation, arbitrary Places centers and radius bounds, provider normalization/attribution, field masks, the 20-result cap, authentication/rate limiting/body-size/error behavior, WALK routes/duration/warnings, malformed polylines, preferences localization fallback, and current/legacy Supabase runtime key selection.

Camera regression tests render the real screen with native boundaries mocked to reproduce SDK 57 Android's missing web-only availability API, initial permission lookup failure, and focus/background state. They prove the screen's control flow and recovery behavior, not hardware rendering. Pure utilities and handlers use Vitest; the limiter test runs actual PostgreSQL in a disposable cluster.

PR #1 follow-ups add four real-hook regressions for watcher callback/setup failures preceding a successful one-shot fix, recovery only when continuous updates resume, and competing watcher/one-shot failures. The reported asynchronous race failed before the fix and passed afterward. Watcher health is now independent of retained coordinates, and a one-shot request cannot erase a watcher failure.

Four map component regressions exercise the actual screen, query client and polyline decoding with native/network boundaries mocked. They cover successful route fitting with padding, a stable viewport during later GPS updates, failed requests, deferred focus and nonzero Android layout. The missing viewport update failed before the fix. These tests verify the map command and lifecycle guards; native camera framing still requires a device.

Four additional map regressions use the production query defaults (`staleTime: 0`, `gcTime: 0`) and reproduce unintended paid requests before the fix. Nearby, details and route observers now stay disabled; Search, POI selection and Walk explicitly fetch the corresponding query. Tests cover focus/foreground changes, location-driven remounts, repeated Search at unchanged or moved coordinates, and explicit recovery after failure. Returning to the map never initiates a provider call; the first nearby search also requires Search. Query data remains transient and is discarded when unused.

Three timeout regressions run the real location service, hook, status component and i18next resources, mocking only native boundaries. Fake timers reproduce the actual 15-second GPS timeout in English, Korean and Japanese and verify successful retry clears the error and cancels the timer. Korean/Japanese cases failed with the previous hardcoded English message. The service now throws a typed timeout error; the hook preserves its code and the UI selects the localized resource. A later one-shot timeout still cannot replace an existing watcher failure.

## External configuration and checks still required

- Supabase and Google credentials were not supplied (`.env` is absent). Hosted migrations, Edge deployment, real sign-in/registration/email delivery, Places/details, Maps tiles/native POI taps, and real walking routes have not been exercised.
- EAS project ID/build environment is not configured. No EAS cloud APK build, signing, installation or hardware validation occurred.
- `ANDROID_HOME` points to a missing SDK directory. Native Gradle/APK compilation was not run. Prebuild and introspection passed; Java alone does not provide an Android toolchain.
- Physical Android checks remain necessary for approximate/precise/denied permissions, GPS disabled/timeouts, compass absence/calibration/magnetic fallback, camera absence/start failure, foreground/background behavior, and layout/attribution visibility across screen sizes.
- Supply public product Terms of Use/Privacy Policy and review Google billing/quotas, key restrictions and data policies before distribution. Default Expo assets remain scaffold assets.

## Dependency advisory review

The locked SDK 57 dependency tree currently inherits advisories for [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [decode-uri-component](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr), [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv), and [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq). The npm count includes packages affected through those dependencies. It is not 30 independently validated application vulnerabilities. No repository-wide security scan or exploitability assessment was performed.

npm's suggested direct-package changes include Expo/React Native downgrades or another Expo SDK, contrary to the locked stack. No forced audit fix or broad overrides were applied. Review compatible upstream fixes and exposure before distribution; a green compiler/bundle is not an advisory clearance.

## Deliberately later work

No curated tourist catalog/restriction, verified destination assets/daytime previews, complete reviewed translations, floating AR POI cards, spatial tracking, 3D engine, comprehensive POI database, admin portal or turn-by-turn navigation is implemented. The shared arbitrary-center Places contract and documented catalog integration point preserve both general discovery and future destination-centered supporting establishments. A future 500-meter destination filter remains separate from the 100-meter initial activation setting.

The corrected camera screen was exported after the regression fix. Subsequent backend-only key selection passed its tests, full TypeScript/lint suite and Deno checks. CI is configured to repeat the available checks on the PR; its result should be read from GitHub rather than inferred from this local report.
