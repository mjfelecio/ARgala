# Foundation validation

Local validation on 2026-10-17 used Node 22.19.0, Expo SDK 57.0.30, TypeScript 6.0.3, Vitest 5.0.5, Deno 2.9.6 and PostgreSQL 14. The existing ARgala root contains the project; no nested app or separate worktree was created.

| Check | Evidence/result |
| --- | --- |
| Lockfile installation | Clean `npm ci` completed after an interrupted registry download was diagnosed and recovered. |
| `npm run check` | Passed after sensor-startup follow-ups: strict TypeScript, zero-warning ESLint, 127 tests across 22 files. |
| `npm run check:edge` | All three Edge entrypoints type-check under Deno. |
| Deno lint | Shared implementation and Edge handlers pass. |
| `npm run test:limiter` | Actual isolated PostgreSQL migration: 32 concurrent calls allowed 30/denied 2; privileges and window reset passed. No existing database was used. |
| `npx expo install --check` | SDK-compatible dependencies confirmed. |
| `npx expo-doctor` | 21/21 checks passed. |
| `npx expo prebuild --platform android --no-install` | Android native project generated successfully; required permissions and blocked audio/background location inspected. Generated native files stay ignored. |
| `npm run check:android` | Introspection validates SDK/platform/package, foreground/camera permissions, blocked audio/background permissions, native Maps key injection, and EAS APK profiles. Uses a nonfunctional process-local validation marker, not a real key. |
| Android export | Source including the sensor-startup/focus follow-up passed Metro/Hermes export (4.5 MB bundle). This is not an APK/native compilation. |
| Independent review | Review follow-ups cover Android camera compatibility/recovery, watcher health, route framing, manual paid requests and localized location/Edge/auth errors. Regression evidence appears below. |
| Dependency audit | `npm audit --omit=dev` reports 30 transitive counted findings (19 high, 11 moderate, 0 critical), rooted in four advisories. See details below. |

The initial main scaffold was checked against the SDK 57 Router template manifests before its first commit. Full compiler/lint/test validation followed the recovered dependency installation on the implementation branch. The branch preserves each coherent unit and its validation in Git; no history was squashed.

## Test coverage and limits

Tests cover coordinate boundaries, finite inputs, Haversine/antipodal/dateline distances, geographic bearing, heading normalization/relative angles, inclusive radius checks, late native subscription cleanup, auth credential normalization, public environment validation, arbitrary Places centers and radius bounds, provider normalization/attribution, field masks, the 20-result cap, authentication/rate limiting/body-size/error behavior, WALK routes/duration/warnings, malformed polylines, preferences localization fallback, and current/legacy Supabase runtime key selection.

Camera regression tests render the real screen with native boundaries mocked to reproduce SDK 57 Android's missing web-only availability API, initial permission lookup failure, and focus/background state. They prove the screen's control flow and recovery behavior, not hardware rendering. Pure utilities and handlers use Vitest; the limiter test runs actual PostgreSQL in a disposable cluster.

PR #1 follow-ups add four real-hook regressions for watcher callback/setup failures preceding a successful one-shot fix, recovery only when continuous updates resume, and competing watcher/one-shot failures. The reported asynchronous race failed before the fix and passed afterward. Watcher health is now independent of retained coordinates, and a one-shot request cannot erase a watcher failure.

Four map component regressions exercise the actual screen, query client and polyline decoding with native/network boundaries mocked. They cover successful route fitting with padding, a stable viewport during later GPS updates, failed requests, deferred focus and nonzero Android layout. The missing viewport update failed before the fix. These tests verify the map command and lifecycle guards; native camera framing still requires a device.

Four additional map regressions use the production query defaults (`staleTime: 0`, `gcTime: 0`) and reproduce unintended paid requests before the fix. Nearby, details and route observers now stay disabled; Search, POI selection and Walk explicitly fetch the corresponding query. Tests cover focus/foreground changes, location-driven remounts, repeated Search at unchanged or moved coordinates, and explicit recovery after failure. Returning to the map never initiates a provider call; the first nearby search also requires Search. Query data remains transient and is discarded when unused.

Three timeout regressions run the real location service, hook, status component and i18next resources, mocking only native boundaries. Fake timers reproduce the actual 15-second GPS timeout in English, Korean and Japanese and verify successful retry clears the error and cancels the timer. Korean/Japanese cases failed with the previous hardcoded English message. The service now throws a typed timeout error; the hook preserves its code and the UI selects the localized resource. A later one-shot timeout still cannot replace an existing watcher failure.

Edge failure regressions verify structured codes survive the client adapter, malformed/transport/invalid-response failures have typed fallbacks, and successful data remains validated. Six map component cases use real translation resources to cover nearby, details and route failures in Korean/Japanese, including rate limits, upstream errors, unavailable walking routes, unknown codes and ordinary errors. Failures reproduced before the fix. Map errors now select localized resources by code rather than rendering provider messages; unknown failures use a localized generic fallback.

Thirteen auth regressions exercise actual screens/provider and translation resources with the Supabase client boundary mocked. They cover known sign-in/registration codes, the SDK's specialized weak-password and network error classes, unknown-code fallbacks, live language changes, sign-out failures and returned/thrown session-restoration errors. Raw SDK messages reproduced the failures before the fix. Auth state now retains translation keys, and UI boundaries translate them with English/Korean/Japanese resources. These tests do not establish live authentication or email delivery.

Fourteen additional location-status cases reproduce non-timeout failures through the real Expo adapter, hook, UI and locale resources. They cover permission/services/one-shot rejection, invalid one-shot coordinates, watcher setup rejection, native watcher callbacks and invalid watcher coordinates in Korean/Japanese. Known invalid-position and unavailable-update codes select localized resources; unknown failures use `location.unavailable`. Diagnostic error text never reaches the UI. Late one-shot success retains watcher failures and their codes. The timeout tests remain in the expanded `location-status.test.ts` suite.

The related message-state audit found Settings still retained translated text. Two screen regressions reproduce a visible validation message staying in the old language even when the new locale resource exists. Settings now keeps typed message keys for validation, save success and save failure; rendering translates them using the current language. These checks use real Korean/Japanese resources.

Five Places integration cases exercise the real client, Edge adapter, authenticated endpoint wrapper and Google request builder with transport/auth/provider boundaries mocked. IDs of 513, 1000 and 4063 characters reach the provider URL unchanged; the last request fills the complete 4096-byte budget. A 4097-byte envelope fails before quota consumption/provider work, and an identifier that alone exceeds the budget fails before invoking Edge. The original 512-character validation reproduced the failure before the fix. The application body limit, format validation, authentication and limiter order remain intact. This proves contract handling, not the existence of the synthetic IDs or live Google responses.

## Project-owner setup report — 2026-10-18

The project owner reported that every step in the [Android setup walkthrough](android-setup.md) worked correctly, including the sequence from external-service configuration through running the app on a phone. This is user-reported evidence, separate from the agent-run automated checks above. The report did not include a device model, Android version, EAS build ID or individual scenario results; those details have not been inferred, and the setup-guide PR does not repeat deployments or builds.

The historical configuration limitations below describe the original foundation validation on 2026-10-17, rather than the current state of the owner's configured environment. Broader permission, lifecycle and field checks remain necessary before client UAT. Use the guide's device checklist to record future evidence.

## Android sensor-startup follow-up — 2026-10-18

The owner subsequently tested on a Samsung A53 5G running Android 16. Sign-in worked, but location remained on “Finding your location…” until the app closed, and the camera appeared only after reopening. The development server showed no error, including when the app closed. This qualifies the earlier general setup report: successful installation/sign-in did not establish functioning GPS or camera startup. A native crash stack and build ID were not supplied, so the cause of the process exit remains unverified.

Five regressions failed before the fix: a foreground change between render and listener registration was missed by the shared app-state hook, the same race prevented the real location hook and camera screen from starting, and stalled permission/services checks never reached the existing GPS-only timeout. The foreground hook now uses a subscription-consistent native snapshot. One 15-second deadline bounds the complete focused location attempt and retires its owner on expiry, ignoring late results and removing late subscriptions. Existing watcher-health rules remain covered.

Twelve added cases cover those failures, subsequent foreground changes/listener cleanup, immediate camera permission grant, late watcher/fix completion after timeout, watcher success while the one-shot request stalls, and leaving/returning through a permission activity. Independent review exposed stale/pending heading state after the timeout stopped its watcher; two further failing cases drove clearing the heading and marking it unavailable when the owner expires. The complete suite passes 110 tests across 20 files, with lint and typecheck. Native boundaries are mocked; these results do not establish that the Samsung hardware behavior or process exit is resolved. Revalidation on that phone remains required. No dependency, native configuration or native-module changes are needed for these JavaScript fixes.

The owner retested that first fix and reported unchanged behavior, including after clearing the bundle cache and app data. The only supplied log was Supabase's deprecated `lock` option warning; no native crash stack was available. This retest means the initial fix has not resolved the reported phone behavior.

A follow-up reproduction uses the installed Expo Router 57 hooks with fixture navigation contexts and a pending navigation-container ref. In that condition the route can report focused while `useFocusEffect` never invokes its callback, so the location deadline is never created. Earlier tests replaced that hook with a plain effect and missed this gate. Location startup and camera permission refresh now use effects owned by the reactive focused/foreground state. Camera permission lookup is explicitly owned by that lifecycle, with rejected lookups handled. Four new regressions failed before these changes and pass afterward: first GPS startup, its deadline, cleanup on loss of focus and camera permission refresh after foreground return. The reproduction establishes an SDK lifecycle condition; it does not establish that this is the condition occurring on the Samsung phone.

Development builds now show a selectable JSON indicator with `sensorDebug: 2`, foreground/focus state and location startup phase (`waiting`, `permission`, `services` or `position`). A matching console trace records state transitions. Camera diagnostics show permission and lifecycle state. These contain no coordinates, credentials or raw native errors and are excluded from release display/logging. One additional real-hook/status regression checks the diagnostic path. Full typecheck, zero-warning lint and 115 tests across 21 files pass. The next phone test should confirm the marker and supply its state if startup still stalls; native process-exit diagnosis remains outstanding.

The owner's next phone trace confirmed the v2 bundle and repeatedly alternated `active: false` / `active: true` with `focused: true` and `phase: permission`. Inspection of the installed Expo 57 Android code found that the request API delegates to `Activity.requestPermissions` even for existing grants. The hook requested again on each foreground return, disposing the previous owner and its deadline. A regression using the real adapter, foreground hook and status UI reproduced four queued native requests while the first permission activity was pending. This supplies evidence for a permission/lifecycle feedback loop; there is still no native crash stack establishing the cause of the process exit.

The adapter now reads current permission before prompting, skips existing grants and permanent denials, and shares only in-flight work across replacement owners/consumers. A mounted attempt can initiate one prompt; a denied state requires an explicit Retry to prompt again. Foreground return still rereads permission so revocations take effect, and settled grants are not cached. Independent review found that a Retry joining a stalled check-only read could lose its prompt intent; a failing regression drove preserving that intent while retaining one native operation. Ten lifecycle cases cover existing grants, repeated activity returns, denial/Retry, permanent denial, revocation, concurrent consumers, stalled requests, rejected reads and the reviewed Retry edge case. Two more real-resource cases cover permission-read errors in Korean/Japanese. Typecheck, lint and 127 tests across 22 files pass, along with Android Metro/Hermes export. The development marker is now `sensorDebug: 3` / `[ARgala sensor startup v3]`. Hardware recovery and process-exit behavior still need a phone retest; these changes require no native rebuild.

After commit `1d23b22`, the owner confirmed that the app is working on the previously identified Samsung A53 5G / Android 16. This is owner-reported recovery of the reported startup problem. Individual GPS/camera scenarios, test duration and a native crash stack were not supplied; this confirmation does not establish broader field/UAT coverage or a native crash diagnosis.

## Camera POI overlays — 2026-10-18

Branch `feat/ar-poi-overlays` starts from `origin/main` at `f01fdbf` and extends the
verified foundation. It adds explicit nearby scans, three approximate portrait
camera labels, nearest-in-radius information, stable manual selection, a compact
list, on-demand details and a Place ID handoff to the existing map/Walk flow.
No backend, database, dependency or native configuration changes were made.
Existing local EAS edits in `app.json` are excluded from the feature commits.

Agent-run checks:

| Check | Result |
| --- | --- |
| `npm run check` | Strict TypeScript, zero-warning ESLint and 169 tests across 24 files passed |
| `npx expo install --check` | Dependencies up to date for SDK 57 |
| `npx expo-doctor` | 21/21 checks passed |
| `npm run check:android` | Android-only SDK/config/permissions/Maps injection/EAS APK profile assertions passed |
| `npm run export:android` | Metro/React Compiler/Hermes Android export passed, including official attribution image variants |

Focused tests exercise bearing wraparound/FOV, inclusive activation boundaries,
distance/direction priority and label collisions, actual camera screen selection,
manual selection through rotation, extra details and map handoff, denied camera
and location, uncertain/stale heading and GPS, independent watcher freshness,
stationary update configuration, empty/loading/failure/retry states and actual
EN/KO/JA resources. Request-cost coverage uses production query defaults and
covers movement, focus, foreground, remount, language change and invalidation.
Existing installed-SDK focus/startup and watcher cleanup regressions still pass.
Independent review identified missing provider credits on map handoff; a failing
regression drove forwarding handoff attributions. Its watcher-freshness concern
also received separate native sample timestamps and screen regressions.

All sensor, network and map UI boundaries in these tests are mocked. Configuration
introspection and Hermes export are not an APK build. No live Places/details,
walking route, phone camera/GPS/compass or visual layout test was performed for
this feature. The configured local environment was used by Expo tooling without
printing or committing credential values. See the [device checklist](ar-device-testing.md)
for field scenarios and the exact MVP sensor/projection limitations. Developer
device testing remains the next acceptance gate; client UAT is not established.

## Original external-validation limits and remaining field checks

- Supabase and Google credentials were not supplied (`.env` is absent). Hosted migrations, Edge deployment, real sign-in/registration/email delivery, Places/details, Maps tiles/native POI taps, and real walking routes have not been exercised.
- EAS project ID/build environment is not configured. No EAS cloud APK build, signing, installation or hardware validation occurred.
- `ANDROID_HOME` points to a missing SDK directory. Native Gradle/APK compilation was not run. Prebuild and introspection passed; Java alone does not provide an Android toolchain.
- Physical Android checks remain necessary for approximate/precise/denied permissions, GPS disabled/timeouts, compass absence/calibration/magnetic fallback, camera absence/start failure, foreground/background behavior, and layout/attribution visibility across screen sizes.
- Supply public product Terms of Use/Privacy Policy and review Google billing/quotas, key restrictions and data policies before distribution. Default Expo assets remain scaffold assets.

## Dependency advisory review

The locked SDK 57 dependency tree currently inherits advisories for [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [decode-uri-component](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr), [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv), and [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq). The npm count includes packages affected through those dependencies. It is not 30 independently validated application vulnerabilities. No repository-wide security scan or exploitability assessment was performed.

npm's suggested direct-package changes include Expo/React Native downgrades or another Expo SDK, contrary to the locked stack. No forced audit fix or broad overrides were applied. Review compatible upstream fixes and exposure before distribution; a green compiler/bundle is not an advisory clearance.

## Deliberately later work

No curated tourist catalog/restriction, verified destination assets/daytime previews, complete reviewed translations, spatial tracking, 3D engine, comprehensive POI database, admin portal or turn-by-turn navigation is implemented. The shared arbitrary-center Places contract and documented catalog integration point preserve both general discovery and future destination-centered supporting establishments. A future 500-meter destination filter remains separate from the 100-meter initial activation setting.

The corrected camera screen was exported after the regression fix. Subsequent backend-only key selection passed its tests, full TypeScript/lint suite and Deno checks. CI is configured to repeat the available checks on the PR; its result should be read from GitHub rather than inferred from this local report.

## Clean Explorer Home UI — 2026-10-18

Branch `feat/ui-home-map` starts from verified `origin/main` at `87db710`.
Work is isolated in `/tmp/argala-ui-home-map`; the owner's original checkout,
uncommitted `app.json` change and supplied kickoff folder remain untouched.
The [approved reference subset](design/clean-explorer/README.md) includes the
unmodified handoff documents and H01 PNG (SHA-256
`f9eedd8c3b5b8cfdd4b16635a975f787270fff0e2e91c927977df8290b1d47a5`).

Home now uses shared Clean Explorer tokens and native pill/circle actions,
floating Search Nearby/AR/Settings/Recenter controls, and a compact docked panel
with an explicit Show more/Show less action. The native Google map remains
mounted underneath. The panel displays actual selected-place and walking-route
content, localized states, location guidance and provider credits. It adds no
provider fields, backend changes, persistent result storage or dependencies.

| Agent-run check | Result |
| --- | --- |
| Baseline `npm run check` | Typecheck, lint and 169 tests across 24 files passed |
| Final `npm run check` | Typecheck, zero-warning lint and 193 tests across 28 files passed |
| `npm run check:android` | SDK 57 Android-only configuration, permissions, Maps injection and EAS profile assertions passed with a nonfunctional marker |
| `npm run export:android` | Metro/React Compiler/Hermes export passed; one Android bundle, approximately 4.5 MB |
| `git diff --check` | Passed |
| Reference comparison | H01 image opened and reviewed; copied PNG hash matches supplied source |

The new tests first reproduced absent primitives/controls/panel and missing
measured layout behavior, then passed with the implementation. Tests use the
real screen, actions, panel, i18next resources and production Query defaults,
mocking native/network boundaries. They cover action variants, busy/disabled
semantics, accessible labels and declared hit targets; unsearched/loading/empty/
error/retry/results states; long names and missing optional fields; route summary
and walking warnings; live error-key translation; selection/AR handoff; no paid
calls on expansion, collapse, pan, focus, foreground, locale changes, remount or
invalidation; and denied/disabled/approximate location feedback. Existing tests
cover explicit Search, POI selection, Walk, error fallbacks and recovery.

Independent whole-branch review found two panel issues. Two failing regressions
drove moving the heading/expansion action into the bounded ScrollView so a
104-unit panel cap cannot allocate all height to a fixed heading, and moving the
returned route summary/caution immediately after the destination before activation
metadata, repeat Walk and Close. The short-height check verifies scroll containment
and declared cap, not native layout at 150% font scale. Both regressions now pass.
Review reported no Critical or Minor issues; the two Important findings were fixed.

Android route fitting reserves the measured header and panel in `mapPadding`,
which also lifts native Google legal controls above the panel. The installed
`react-native-maps` Android implementation **adds** `fitToCoordinates` edge
padding to `mapPadding`, so fit calls supply only a bounded extra margin.
Changes in map/overlay dimensions refit an existing route without another paid
request; GPS updates alone leave the viewport stable. These tests verify native
props/commands, not the final Yoga geometry or Google camera animation.

Intentional differences from H01: Android system font and CJK glyph fallback
(no supplied Plus Jakarta Sans binary); existing protected-stack header and
AR/Settings entry points (future three-destination shell is excluded); explicit
expand/collapse instead of a decorative drag handle; actual Google tiles and
provider data. No categories, microphone, Saved/avatar interactions, sample
ratings/hours or static Lisbon artwork were added. The existing shared controls
on other screens and their presentation remain outside this UI pass.

**Device/visual acceptance remains pending.** Neither `adb` nor a local Android
emulator is installed in this environment; no before/after device screenshots,
configured APK build/install, live provider calls or outdoor tests were performed.
H01 comparison at matching viewport, normal/150% text, Korean/Japanese long labels,
short/multiwindow screens, insets, native Google attribution visibility and touch
reachability requires a real Android run. Manually exercise Search/no results,
native POI tap/details failure, AR return/selection, Walk/no route, panel expansion,
location denied/disabled/approximate and background/foreground transitions before
client demonstration. Passing tests and export do not establish UAT.

Packages and native configuration did not change, so SDK dependency checks,
Expo Doctor and Edge/limiter checks were not rerun for this UI-only change.
## UniWind / HeroUI infrastructure — 2026-10-18

Phase 1 starts at stable main `69bebee`; PR #6 is unmerged. See [integration architecture and component mapping](ui-infrastructure.md). Product screen layouts, paid request flows, sensors and backend code remain unchanged.

- Baseline: `npm run check` passed typecheck, zero-warning lint and **169 tests / 24 files**.
- Focused regression: EAS app-config metadata test failed before preservation of `config.extra` and passed afterwards; environment override remains supported.
- Showcase tests use the actual installed HeroUI components and actual locale resources with native runtime boundaries replaced. They cover selection/reset, accessible selection/disabled/busy state, visible loading labels, Korean/Japanese language changes and development/release/flag access combinations. They do not assert native rendering from mocked output.
- `npm run check` passed typecheck, zero-warning lint and **179 tests / 26 files**.
- `npx expo install --check`: dependencies up to date.
- `npx --yes expo-doctor`: **21/21 checks passed**.
- `npm run check:android`: SDK 57 Android-only configuration, foreground/camera permissions, blocked background/audio permissions, native Maps injection and EAS APK profiles passed.
- `npm run export:android -- --max-workers 2`: Android Metro/Hermes export passed with the official UniWind transformer and actual HeroUI showcase imports.
- Independent review identified an unconverted third-party SafeAreaView `className`; explicit UniWind wrappers now adapt both the showcase SafeAreaView and gesture root. No other Critical/Important findings were reported.
- **Real Android development APK build passed** on EAS (`developmentClient: true`, SDK 57, including native SVG and bundled font resources): [844de55b-febb-4247-a485-05d2b813145e](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/844de55b-febb-4247-a485-05d2b813145e). [Installable APK](https://expo.dev/artifacts/eas/T3IyZC5L4RCe4mf3qf8IXIBhX6IrFmissnpLbRmNhfo.apk). The native configuration was uploaded during implementation; it matches the final PR, and the development client loads current JavaScript from Metro.
- Android runtime verification is **pending**: EAS Simulator reports unavailable for this account. A temporary local Android 15/API 35 AOSP emulator setup was attempted, but boot failed before installation because the emulator required a 7372.80 MB userdata partition with only 5708.46 MB available. The temporary SDK/AVD/downloads were removed. No Android screenshots or successful installation/interaction are claimed.

The successful development APK build establishes native compilation; it does not establish device layout, TalkBack, CJK fallback, 150% text, pressed animations or scrolling. Those showcase scenarios still need installation and runtime testing. Live Google/Supabase, Maps, permissions, GPS, camera, heading and routes also remain field-test work; the diagnostic does not exercise them. No Edge changes were made, so Edge/limiter-specific checks were not rerun.

### Runtime color regression — 2026-10-19

The owner reported a missing `--color-accent-hover` warning and Reanimated's
`Invalid color value: "invalid"` error while testing PR #8. Installed HeroUI
1.0.10 reads that variable in Button's highlight animation and returns `invalid`
when UniWind cannot resolve it. Our non-static CSS override removed the imported
theme's static flag, allowing Tailwind to omit the hook-only variable.

A regression compiles the actual global CSS and library imports using UniWind's
installed Tailwind compiler, without utility candidates. It failed before the
fix because `--color-accent-hover` was absent. It now checks the approved pressed
green, soft colors, dependent primitives, route blue and the other Button runtime
color declarations. Project tokens use `@theme static`; HeroUI overrides use
`@theme inline static`. Component/native mocks remain distinct from this real
compiler check.

`npm run check` passed typecheck, zero-warning lint and **180 tests / 27 files**.
`npm run export:android -- --max-workers 2` passed Metro/Hermes compilation.
No dependencies or native configuration changed, so the existing Phase 1
development APK can load this fix after restarting Metro with a cleared cache.
The reported Android crash still needs an owner retest of the corrected bundle;
these compiler results do not establish successful device rendering.

## Home Map HeroUI rework — 2026-10-19

This is a review stack on infrastructure PR #8, continuing PR #6 without merging either PR. Home actions use actual HeroUI Native Button, Surface, Card, Chip and Spinner components with Ionicons and UniWind utilities. `global.css` owns the visual tokens, including the native route-area color; custom primitives and the TypeScript token theme are removed. The only sheet dependency added is JavaScript `@gorhom/bottom-sheet` 5.2.14 with its JavaScript portal dependency; existing native peers and font configuration match the successful Phase 1 development APK.

Regressions use actual HeroUI components, actual EN/KO/JA resources and production Query defaults. Native sheet/animation/map drivers and provider requests are mocked. They cover:

- Explicit Search/selection/Walk costs across focus, foreground, remount, language changes, invalidation and recovery; expansion makes no paid call.
- Full-details action hidden after success, restored after cache reset or a failed/summary-only selection, and removed after explicit recovery. The equivalent AR action is guarded; a requested new language still works.
- Accessible disabled/busy/expanded state, visible long names, truthful empty/loading/error/results/route states, warnings and attribution.
- Native sheet positions update Google credit padding while route fitting waits for settled geometry. Resizing an expanded sheet at the same native index and returning to the same index inside the update interval both retain correct final padding.
- The SDK's English handle node is excluded from TalkBack; Korean/Japanese expansion uses the translated real button. The entire heading/content remains scrollable in a short panel.

The duplicate-details regressions failed before the guards. Independent review found the expanded-resize bug and untranslated SDK handle; focused regressions failed before fixes and passed afterwards. No Android runtime result is inferred from these mocks. Owner has agreed to install and check the development APK; no completed device result or screenshots have been supplied yet. Live Maps/provider/permission/GPS/camera/heading/routes field checks remain pending.

Final local checks for this rework:

- `npm run check`: typecheck, zero-warning lint and **205 tests / 28 files** passed.
- `npx expo install --check`: dependencies up to date; `npx --yes expo-doctor`: **21/21** passed.
- `npm run check:android`: SDK 57 Android-only config, permissions, native Maps injection and APK profiles passed.
- `npm run export:android -- --max-workers 2`: final Android Metro/Hermes export passed (**2542 modules**, 6.9 MB bundle).
- `git diff --check`: passed.

The real EAS development APK success is recorded in the preceding infrastructure section. This rework adds no native module or native configuration, so it can run against that APK with current JavaScript from the Home branch's Metro server. No Edge changes were made; Edge/limiter-specific checks were not repeated. APK installation, device rendering, TalkBack, drag/scroll interaction, enlarged/CJK text and live integrations remain unverified until the owner supplies device results.

After carrying the runtime color fix from PR #8, the compiler regression also
checks the hook-only route-area color. Compiling the original declarations
without utility candidates omitted both route tokens; the static theme retains
them. `npm run check` passed typecheck, zero-warning lint and **206 tests / 29
files**. `npm run export:android -- --max-workers 2` passed again. Device retesting
of the corrected bundle remains pending.

### Bottom-sheet development invariant — 2026-10-19

After PR #8 was merged, the owner reported PR #6 failing with
`'containerHeight' is deprecated, please use 'containerLayoutState'.`
Gorhom 5.2.14 still types the deprecated prop, but its development validator
throws when it is supplied. The native sheet test double previously skipped
that validator and concealed the incompatibility.

HomePlaceSheet now supplies the supported shared `containerLayoutState`.
Map-height changes update the height while retaining SDK-measured offsets.
The test boundary runs the installed library's actual JavaScript prop validator,
with gesture/animation drivers mocked. A new regression reproduced the exact
invariant before the fix and passes afterwards, covering layout-state identity,
height changes and offset preservation. Existing map geometry tests now consume
the current layout API.

The reported duplicate-details review case is already guarded by
`detailsLoaded={!!details.data}`, the hidden recovery action after success and
the `onDetails` data guard. Existing real-screen regressions pass for expansion
without another paid request, explicit recovery after cache reset, and recovery
from a failed summary-only selection. No request-policy change was needed here.

- Targeted sheet/map regressions: **42 tests / 2 files** passed.
- `npm run check`: typecheck, zero-warning lint and **207 tests / 29 files** passed.
- `npm run export:android -- --max-workers 2`: Android Metro/Hermes export passed.
- No dependency or native configuration changes; another APK build is unnecessary
  for this fix. Android rendering, sheet drag/resize, attribution placement and
  live provider interactions still need an owner retest of the corrected bundle.

### Android Maps padding startup race — 2026-10-19

The owner supplied a recurring native `NullPointerException` in
`MapView.applyBaseMapPadding` through the Fabric `setMapPadding` setter during
map initialization. Installed Maps 1.27.2 forwards `mapPadding` before readiness;
its Android method defers for zero-sized layout but dereferences `map` without a
null check once layout has a size. Home supplied padding immediately, and local
header/sheet measurements could update it before `GoogleMap` initialization.
This matches the supplied stack and explains the startup ordering dependency.

Home now omits the native padding prop until the current map instance reports
`onMapReady`. Local measurements continue, and readiness applies their latest
values. A location-driven map remount resets that gate. No timeout, paid request,
native patch or dependency change is introduced.

Two real-screen regressions failed before the fix because padding was sent
before native readiness. They now pass for delayed initialization, header/sheet
layout updates, foreground return, latest padding after readiness, continued
padding updates and location-driven remounts. They assert no incidental paid
requests. Native Maps is mocked, so they verify dispatch timing rather than
executing the Android Java code.

- Targeted map tests: **31 tests / 1 file** passed.
- `npm run check`: typecheck, zero-warning lint and **209 tests / 29 files** passed.
- `npm run export:android -- --max-workers 2`: Android Metro/Hermes export passed.
- The existing development APK can load this JavaScript fix. Repeated cold
  launches and navigation back to the map still need a phone retest; no native
  crash recovery or live Google integration result is claimed from these checks.
