# Foundation validation

## Design coherence refinement — 2026-10-31

From main `775f9da`, the scoped cleanup preserves the approved October 30 compact
Explore header, measured Directions peek, farther AR panels and held collapse
interaction. [Audit, skill provenance and before/after evidence](audits/2026-10-30-design-coherence.md)
record the design authority and full screen coverage/limits.

Installed official Impeccable 4.8.0 for project Codex (reviewed source/installer,
no force or app dependencies), portable `argala-ui`, and evidence-backed PRODUCT /
DESIGN indexes. Existing Expo design-system/native-UI/animation guidance was
evaluated; overlapping Taste was not installed. Codex hook approval remains an
interactive `/hooks` step; this session does not claim it ran in Codex.

Changes keep growing Profile/guest content within SettingsForm's existing scroll
owner; simplify Featured destinations to name-first white tappable surfaces with
maintenance below the catalog; and virtualize Saved with subordinate removal and
bounded visible IDs. IDs, navigation, full accessible identifier, save/draft logic,
catalog status, provider/sensor/admission/storage/localization contracts remain.
No new copy, native configuration, dependency, backend or production review route.

**Automated/static:** deliberate failing-before/passing-after real-screen
regressions; focused layout/catalog/Saved run **41 passed**. Final `npm run check`
passes strict TypeScript, zero-warning lint and **1,266 tests /116 files**.
`npm run check:native-patches` passes with zero updates; `git diff --check` passes.
`npm run export:android -- --max-workers 1` passed on the explicit rerun: 3,000
modules and an 8.5 MB Android Hermes bundle. The cancelled attempt is not counted;
an export is not an APK/native build. Edge/SQL/native-configuration checks were not
rerun locally for unchanged areas; PR CI repeats the complete matrix.

**Rendered only:** actual production components + HeroUI/CSS/fonts/resources in
an isolated React Native Web harness, synthetic journal and mocked service context.
18 baseline /27 after screen-state probes and six Profile input-scroll captures
per revision. EN/JA/KO at 360×800 normal and 320×640 with 1.5 text-only enlargement;
Saved empty/loading/read-error states. Reviewed captures and browser bounds show
no horizontal overflow or sub-48×48 button targets; no uncaught after-probe JS
exception. Browser review exposed and corrected HeroUI CSS/class-merger precedence.
Browser font scaling/insets, color diagnostics and keyboard differ from Android.

**Not performed:** no connected ADB device, fresh APK build/install, native Yoga /
TalkBack /keyboard /touch /fling or foreground acceptance, AR tracking/camera/photo
checks, live authenticated/provider checks, on-site GPS or background reminder
delivery. No account reset, synthetic runtime location, new content approval or
device data modification. Existing compatible APK can load these JS changes via
Metro; any new APK still requires specific owner approval.

## App shell navigation — 2026-10-19

Branch `feat/app-shell-navigation` starts from current main `b15a37d`, which includes the merged Home Map and UI infrastructure. The shell implementation is `8dc6226`. The [navigation guide](app-shell-navigation.md) records route structure, component reuse, layout ownership, visual deviations and the Android acceptance checklist.

Agent-run checks after the implementation:

- `npm run check`: typecheck, lint (zero warnings), **30 test files / 221 tests passed**; baseline was 29 files / 209 tests.
- Focused shell/map/AR/SDK-hook run: 4 files / 71 tests passed before the final handoff reducer case; the complete check above includes that additional case.
- `npx expo install --check`: dependencies up to date; no dependencies or native configuration changed.
- `npx expo-doctor`: **21/21 checks passed**.
- `npm run check:android`: passed SDK 57, Android-only configuration, foreground/camera permissions, blocked audio/background permissions, Maps injection and APK profiles.
- `npm run export:android`: completed the Android Hermes export. The terminal emitted environment color-flag warnings; this is not a runtime failure. An export does not prove an APK build or device presentation.
- `git diff --check`: passed.

An independent read-only review found no confirmed code issues and reran the shell, map and SDK-hook suites: **47 tests passed across 3 files**. Installed Maps 1.27.2 Android source retains the `GoogleMap` while detaching a tab, saves/restores features and padding, and pauses/resumes the native view; it does not destroy the map on tab detach. Physical reattachment and credits still require the acceptance checks below.

[GitHub validation run 39251306529](https://github.com/mjfelecio/ARgala/actions/runs/39251306529) passed the complete PR workflow, including Edge typecheck/lint and the isolated PostgreSQL limiter test, in addition to the app and Android checks. These Edge/limiter checks were run by CI, not repeated locally for this navigation-only change.

Development APK build: [EAS bdcbe9f3-7101-4833-aab8-dbe867ba4529](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/bdcbe9f3-7101-4833-aab8-dbe867ba4529), using the existing `development` profile/environment and existing Android signing credentials, from implementation commit `8dc6226`. The EAS record supplies build status and the install artifact; it does not establish installation or presentation verification. Use Metro from this branch for the current JavaScript.

Regressions first reproduced duplicate map branding/actions, loss of the native map during a GPS restart, and a redundant map bottom inset. Coverage now exercises configured tab destinations and active icons/colors, native bottom-inset allocation, Settings/return actions, live English/Korean/Japanese labels, installed SDK tab/stack reducers for Back/direct AR entry/POI parameters, persistent selection/route/expanded sheet during GPS restarts, and credit/sheet geometry in the reduced scene. Existing actual-screen tests cover explicit Places/details/Routes requests, failure recovery, focus/foreground/remount cost guards, AR-to-map handoff, attribution and walking warnings. New sensor cases exercise the installed SDK focus hook with delayed navigation readiness, real AR screen/location hook, camera unmount, GPS/compass cleanup on blur, restart on return, and late native subscription disposal.

Native rendering, hardware and network boundaries are replaced in the Node component tests. The local environment has no installed Android emulator/ADB or connected USB phone. EAS CLI authentication works, but `simulator:availability --json` returned `available: false` for the configured team. No cloud simulator session was started. Consequently the new shell has **not** been visually verified on an Android development build or physical device, and this work makes no new claim about live GPS, compass, camera, Maps, Supabase or paid Google integration. The guide's acceptance checklist remains required, including both Android navigation modes, larger text, permission revocation, direct links/Back, AR handoff, route framing and attribution above the expanded sheet.

## Foundation baseline — 2026-10-17

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

### POI Details screen — 2026-10-19

Implemented from latest upstream `main` (`da2ef4e`, PR #9 merged), using the
owner-supplied implementation package and both exported P01/P02 PNG/HTML
references. See [the execution plan](superpowers/plans/2026-10-19-poi-details.md)
and [presentation decisions](design/clean-explorer/PLACE_DETAILS.md).

One protected parent-stack Details screen is reachable through explicit View
Details actions on Map and AR. It reads the existing in-memory selection and
language-keyed details queries. Only explicit Load Details recovers missing or
evicted full content. Back preserves the source tab. Directions / Map / AR
return through the existing tab navigator, and Map centers a handoff only after
native readiness. Directions still requires a second, explicit **Get walking
route** tap on Map; this PR does not implement one-tap route preview.

The presentation uses HeroUI Native, UniWind and the existing `global.css`
tokens. It shows real name, optional address/description, destination coordinates,
Google Maps branding and supplied third-party credits. It owns no location
watcher and asserts no user distance from retained Map/AR samples. A future
approved-image slot is tested with clearly synthetic fixtures; no runtime
photograph or unsupported provider metadata was added. AR also retains credits
when displaying a handoff without nearby results.

Validation performed:

- Baseline `npm run check`: **221 tests / 30 files**, typecheck and lint passed.
- Task-specific failing tests were observed for the missing page, sparse content,
  entry actions, navigation, incoming AR selection, Map readiness/centering and
  handoff-only AR attribution, followed by passing targeted suites.
- Final `npm run check`: **264 tests / 31 files**, typecheck and zero-warning lint
  passed.
- `npm run check:android`: passed configuration introspection.
- `npm run export:android -- --max-workers 2`: passed Android Metro/Hermes export.
  Metro printed the existing NO_COLOR/FORCE_COLOR environment warning.
- `git diff --check`: passed.

Regressions use real HeroUI components, actual EN/KO/JA resources, the shared
QueryClient defaults and real error mapping; native and network boundaries are
mocked. They cover cached/cold/evicted content, malformed IDs, optional media
and image failure, long names, optional sections, summary retention during
loading/failure, duplicate action guards, localized known/unknown errors and
recovery, third-party links and sanitized link failures, refocus, foreground
return, reconnect, invalidation, locale changes and remount without incidental
paid requests. Installed SDK Stack/Tab reducers and route payload traversal
verify source-tab Back behavior and returning to the existing parent tabs.
Existing permission, sensor startup/readiness, camera and routing suites remain
part of the full check.

Android device verification **was not performed**: `adb` is unavailable and no
Android handset appeared in the local USB inventory. No new APK was built or
installed. No GPS, compass, camera, native Maps, live Google/Supabase, TalkBack,
large-system-text or pixel-level rendering result is claimed. The exported
references were compared to the component hierarchy and supported data, not to
an Android screenshot of this implementation.

Outstanding device acceptance, using configured providers and a real account:

- Map → selected POI → Details → Back; AR → selected POI → Details → Back.
- Name-only, address/description, cold/evicted data, loading and error recovery;
  EN/KO/JA, long names, enlarged font, TalkBack order and at least 48-unit targets.
- Directions → Map → explicit Walk; Map/AR switching and foreground return with
  no duplicated scan/details/route calls; selected remote POI centering.
- Permission denial/revocation, stale GPS and heading, camera lifecycle and
  off-map Google/third-party attribution visibility and links.

No dependency, provider schema/field mask, Edge function, limiter migration,
native configuration or persistent provider-content storage changed. Edge,
limiter, dependency doctor and APK checks were therefore not rerun for this
JavaScript feature; CI still runs the repository's configured checks.

Independent read-only whole-branch review approved the PR with no findings and
separately passed typecheck, zero-warning lint and **109 tests** across Details,
AR, Map and app-shell suites. [PR #10](https://github.com/mjfelecio/ARgala/pull/10)
is open against `main`; native acceptance remains pending and no merge was done.

### Walking Directions / Route Preview — 2026-10-19

Implemented the owner-supplied compact R01 kickoff on
`feat/walking-route-preview`, based on upstream `main` at `a84c215` (PR #10
merged). See the [execution plan](superpowers/plans/2026-10-19-walking-route-preview.md)
and [presentation/cost decisions](design/clean-explorer/ROUTE_PREVIEW.md).

Details **Get Directions** now opens a protected parent-stack walking preview
in one tap. A single-use transient intent authorizes one request only after a
fresh foreground position and healthy continuous watcher sample. The session
observer stays disabled for paid work; remount can reuse a result but cannot
inherit acquisition authority. Explicit retries create a fresh intent. Auth
clearing revokes sessions and prevents late responses from restoring results.
Home **Get walking route** stays functional; **View Route** reuses the completed
route and original submitted origin with zero new requests. Back to the same
POI preserves Home's route. No Edge, provider schema, limiter, dependency, native
configuration or persistent-storage changes were made.

Checks performed:

- Baseline `npm test`: **264 tests / 31 files** passed.
- Test-first failures were observed for the absent handoff/map, delayed-GPS
  acquisition, duplicate/lifecycle cost boundaries, retry/error recovery,
  Details/Home navigation, native loading state and synchronous adapter failure;
  targeted suites passed after implementation.
- Final `npm run check`: typecheck, zero-warning lint and **322 tests / 34 files**
  passed. The directions suites include **58 tests / 4 files**. The affected
  Directions/Map/AR/Places run before final presentation additions passed
  **183 tests / 12 files**.
- `npm run check:android`: passed SDK 57/Android-only configuration introspection,
  permission exclusions, Maps injection and EAS APK-profile checks.
- `npx expo install --check`: passed, dependencies up to date.
- `npm run export:android -- --max-workers 2`: passed Metro/Hermes Android export.
  This is a JavaScript/assets export, not an APK build.
- `git diff --check`: passed.

Tests use actual locale resources, real HeroUI components and the application's
QueryClient defaults. They exercise single-use/expired/invalid claims, clearing
and changed-target handoffs, captured-origin reuse, delayed/stale/inaccurate GPS,
watcher failure, permission denial/services/timeout, resume ownership, bare URLs,
rapid duplicate actions, pending/success/error remounts, locale/invalidation/
reconnect/refocus, explicit retries, known/unknown sanitized errors, malformed
polylines, actual warnings/credits, missing address, long names, measured dock/
short viewport/safe areas, native readiness/reset, Fit/Recenter and Back. A
lifecycle suite uses the installed Expo SDK focus hooks, pending navigation
readiness and real location hook with native/network boundaries replaced; it
covers full startup timeout and permission-activity foreground transitions.

The approved R01 PNG was inspected. The implementation follows its compact
header/map/rounded-dock hierarchy, with intentional differences documented in
ROUTE_PREVIEW.md: real map/native pins, no terrain claim or screenshot map
artifacts, localized metric wording, actual caution/warnings, a fixed scrollable
dock, and no Share/Profile controls. No native screenshot comparison is claimed.

Android device/UAT: **NOT TESTED**. `adb` is unavailable; no APK was built or
installed in this run. Live Google/Supabase calls, physical GPS/compass/camera,
Android rendering, actual legal-label placement, native pin colors, TalkBack,
rotation and 150% system-text usability remain unverified. Component geometry
checks do not substitute for that evidence. Run the recorded Android acceptance
scenarios with configured providers and a real account before demonstration.
Edge/limiter checks and Expo Doctor were not rerun because no server, native
configuration or dependencies changed.

Independent whole-branch review identified two important issues, both corrected
with regressions observed RED→GREEN: native padding could exceed a short
viewport after actual controls measurement/resize, and later POI details could
replace the submitted route destination. Controls now share a horizontal row,
native padding is bounded, fitting waits for dock resize measurements, and the
submitted destination is retained separately from current place metadata.
Additional RED→GREEN tests enforce wall-clock freshness at the paid-call boundary
and prevent an older waiting screen from spending a replacement owner's intent.
The full check and Android export were rerun after this fix pass. No reviewer
findings were deferred; device limitations above remain unchanged.

[PR #11](https://github.com/mjfelecio/ARgala/pull/11) is open against `main`
on `feat/walking-route-preview` and remains unmerged. Local final checks above
passed; GitHub validation was queued at handoff. No credentials or supplied
untracked kickoff packages were committed.

### Walking preview review correction — session-gated GPS

Confirmed that the unconditional location hook started permission/service work
and high-accuracy GPS for missing, invalid, expired or consumed preview links,
even though paid Routes calls were already prevented. Added an optional location
hook enable gate (default true for existing Map/AR consumers) and derive it from
the claimed preview session. Dead links, unconfigured Maps, expired waiting
sessions and remounted unspent sessions now remain local without permission
checks or watchers. Explicit route retry can re-enable sensors; pending/completed
previews retain the live marker and Recenter. Inactive sessions no longer show
misleading GPS loading/retry copy.

Nine regressions were observed failing before their fixes, using the real
location hook and installed Expo focus hooks with delayed navigation readiness:
five dead-link forms across focus/resume/remount, missing Maps configuration,
expiry with delayed native setup cleanup, unspent-session remount/retry, and
fresh ownership after failed acquisition/retry. The latter prevents a retained
pre-disable fix from bypassing renewed permission/watcher startup.

Validation: `npm run check` passed typecheck, zero-warning lint and **331 tests /
34 files**. The affected Directions/Location run passed **125 tests / 10 files**.
`npm run export:android -- --max-workers 2` and `git diff --check` passed.
No native configuration, dependencies, server contracts or translations changed.
Physical Android permission activities, GPS, live providers and UAT remain
**NOT TESTED**. The fix is a follow-up on unmerged PR #11.

### AR Camera Clean Explorer presentation — 2026-10-19

Base: merged Walking Directions on `origin/main` (`3210fe6`), branch
`feat/ar-camera-ui`. Immersive header, bounded selected/unselected badges and a
compact expandable nearby dock retain the existing camera/location owner and
explicit Places actions. Details/Map preserve transient selection; Directions
creates one single-use intent and reuses the existing fresh-GPS route preview.
[Design notes](design/clean-explorer/AR_CAMERA.md) document reference deviations,
component boundaries and native geometry styles.

Focused tests exercise the real AR screen, HeroUI components, TanStack Query
production defaults and locale resources. Native camera, GPS, sheet driver and
network boundaries are mocked. Regressions cover the sole header/Map return,
true-heading fallback, font-scaled bounded labels and stable CJK IDs, compact
peek/gesture/explicit expansion, selection changes and delayed measurement,
credits outside the sheet, camera failure/retry, short viewport resize, loaded
and failed details, single-use Directions/double-press gating, and no paid calls
on focus/resume/movement/language changes/remount. The AR-to-route integration
executes the real preview hook and verifies exactly one walking request; existing
installed-SDK focus-hook and delayed navigation-readiness regressions also run.

`npm run check` passed typecheck, zero-warning lint and **346 tests / 36 files**.
The targeted AR run passed **62 tests / 5 files**. `npm run check:android`,
`npm run export:android -- --max-workers 2` and `git diff --check` passed.
Compact unselected-badge geometry was observed RED→GREEN before this final run.

Android device/UAT: **NOT TESTED**. No `adb` executable is available; no APK was
built or installed, and no native render screenshot was captured. Live providers,
physical GPS/compass/camera, TalkBack, native gesture/hit behavior, rotation,
large text and outdoor direction accuracy remain pending the acceptance cases
in AR_CAMERA.md. Metro/Hermes export and mocked layout checks are distinct from
that evidence. No server contract, native configuration, dependency or SDK
changes were made; Edge/limiter checks, Expo install compatibility and Doctor
are left to the PR workflow rather than rerun locally for this UI pass.

Independent review found a native sheet startup race and loss of expanded state
when a short viewport temporarily has one detent. Both were reproduced RED→GREEN.
The sheet now carries its requested index through the native prop, preserving
logical expansion independently of geometric clamping. The native test driver
uses the installed SDK's reactive-index hook and drops pre-readiness imperative
requests, which the previous immediate driver masked. The corrected AR/navigation
run passed **72 tests / 6 files**; full checks and Android export were rerun.
No review findings were deferred. Physical-device limitations above remain.

### Featured Destinations — 2026-10-20

Base: `origin/main` `be3971b` (merged AR Camera PR #12). Branch:
`feat/featured-destinations`. The supplied kickoff SRS §3 was inspected directly;
D01–D09 are provisional names, with no approved geographic or tourist content.
[Destination notes](design/clean-explorer/DESTINATIONS.md) record the per-field
approval contract, readiness table, visual deviations and Home-map handoff gate.

The protected catalog and destination pages browse without location/camera
ownership. Approved bundled photos support credits, exact photo counts,
fullscreen close/Android Back and translated empty/error states. Approved copy
and photo metadata fall back per field to visibly labeled English. Actual
runtime records have no media or copy, so all nine show honest empty states.

Explicit nearby search uses the independently approved destination center and
fixed 500 m radius, filtering exact unrounded distances before display rounding.
Results retain provider IDs, linked attribution and the 20-result limitation.
No optional user GPS distance is added. Directions requires an independently
approved visitor entrance, creates one transient intent and uses the existing
fresh-GPS walking preview. Curated details return to the catalog; curated IDs
never enter Google details or Home's Google selection path. Destination-centered
Home-map handoff is deferred, with no inert action in the UI.

Automated coverage uses the real screens/components, actual EN/KO/JA resources,
production Query defaults, route-preview hook, and installed Router route-tree,
path parser, validator and stack reducer. Native rendering, sensors and network
are mocked. Synthetic complete-content fixtures are test-only. Regressions cover
all nine deep links, invalid IDs, no-GPS/no-Maps Home entry, 499/500/500.1/501 m
eligibility, disabled paid-query observers, errors/explicit recovery, language
changes, foreground/refocus, reconnect, invalidation, remount, cache eviction,
offline attempts and authentication cache clear. Rapid navigation/search/direction
presses do not duplicate their respective actions.

Nearby selection exposed a shared zero-cache-lifetime race before details
mounted. Both Nearby and Route Preview reproduced it; `setPlaceSelection` now
sets transient retention before storage for all producers. Delayed navigation,
expiry and auth clear are tested. Independent review then found direct-detail
Back skipping the catalog and missing English fallback markers on unselected
thumbnails. Both were reproduced RED→GREEN. The catalog now has its own anchored
stack, testing native Back through catalog to Explore even for unknown IDs.
No review findings remain deferred.

`npm run check` passed typecheck, zero-warning lint and **425 tests / 43 files**.
The review-fix run passed **83 targeted tests / 4 files**. `npm run check:android`
and `git diff --check` passed. `npm run export:android -- --max-workers 2` passed
the final Metro/Hermes export after both review fixes. One earlier suite run overlapped Metro export and
hit default test timeouts in existing Map/AR/Edge tests; the isolated 421-test run
and subsequent final 425-test run passed without changing timeout settings.
`npx expo customize tsconfig.json` regenerated ignored local route declarations;
it produced no tracked config change. No SDK, dependency, native configuration,
Edge implementation or migration changed, so install compatibility/Doctor and
Edge/limiter-specific commands were not rerun locally.

Android device/UAT: **NOT TESTED**. No `adb` executable is available; no APK was
built or installed and no Android render screenshot was captured. Physical
Back/gallery interaction, long text/CJK at 150% font scale, sign-out navigation,
permissions, live credited Places results, real visitor entrances, GPS freshness
and live Google/Supabase integration still require a configured device and
client-approved content. Native Map/camera/compass behavior is not established
by a component mock, configuration introspection or Metro export.

All nine sites still need approved names, centers, accessible entrances, copy,
daytime assets/rights and content translations. Name variants Janagdan/Hanagdan
and Alto/Alta remain unresolved. The application journey is reviewable, but
content-complete nine-site field UAT remains blocked on those approvals.

## W01 Welcome and language selection (2026-10-20)

PR #13 was confirmed merged before branching from `origin/main` at `81965ff`.
The supplied kickoff design, implementation plan and corrected HTML (trailing whitespace normalized)
are preserved in `docs/design/clean-explorer/WELCOME.md`,
`docs/superpowers/plans/2026-10-20-welcome-language.md` and
`docs/design/clean-explorer/references/welcome-stitch-reference.html`.

New unauthenticated installs enter `/welcome`; returning users enter Sign In,
and restored sessions retain the authenticated app. Root guard composition
waits for restoration and preserves existing setup/auth recovery. Completion
saves language through real SettingsProvider with the existing radius, then
commits `argala.onboarding.v1`. An incomplete value in that same key prevents a
partially saved language from becoming a false legacy migration on restart.
Legacy migration leaves the old preferences bytes unchanged. Authenticated
bypass survives same-process sign-out even if its best-effort marker write
fails. Unauthenticated storage failures use localized explicit recovery.

Automated onboarding coverage uses real SettingsProvider, i18next with actual
EN/KO/JA resources, HeroUI components, production Query defaults, and installed
Expo Router protected-child filtering, path parser, validator and stack reducer.
Native rendering, storage and auth snapshots are mocked boundaries. Cases cover
new/completed/legacy/corrupt records, pending-marker restarts, every write-failure
stage, explicit retry, radius preservation, rapid presses, delayed auth/reads,
stale results/unmount, selected radio semantics, local preview, localized error
and recovery, sign-out, protected private deep links and removal of Welcome Back
history. Mount/refocus/foreground/reconnect/locale/remount tests assert no query,
network, sensor permission or watcher work. UI tests first failed against the
empty route scaffold; provider and pure-helper tests first failed before their
modules existed, then passed with implementation.

`npm run check` passed typecheck, zero-warning lint and **471 tests / 47 files**.
`npx expo install --check` passed (dependencies up to date), `npx expo-doctor`
passed **21/21** checks, and `npm run check:android` passed. `npm run export:android -- --max-workers 2` passed the Metro/Hermes
Android export (7.1 MB bundle). `git diff --check` passed. Independent
whole-branch review of `81965ff..fdbf491` found no Critical, Important or Minor
issues. The reviewer did not rerun checks or claim Android device verification. No SDK,
dependency, native configuration, Edge implementation or SQL migration changed;
Edge/limiter checks were not rerun for W01.

Android APK/device/UAT: **NOT TESTED**. No `adb` executable/device is available;
no APK was built or installed and no native render screenshot was captured.
The screen uses deliberate original green/mint vector scenery. The reference's
remote Google-generated image is not bundled or fetched, and the corrected PNG
was invalid. Approved photo rights/provenance and a valid screenshot are still
needed for photographic/pixel-parity work.

Before client UAT, exercise on a configured Android build: clear storage/fresh
install; all three choices then Continue; restart skips Welcome; legacy valid,
empty and malformed preferences; restored session and later sign-out; preserve
default/custom AR radius; offline launch; injected storage read/preference-write/
marker-write failures and explicit retry; process restart after partial save;
private destination/details/directions deep links; gesture and three-button Back;
small phone and 150% font scale with CJK; TalkBack selection/busy/errors; continuous
bottom safe area and native system bars. Check no camera/GPS prompt or paid
provider request while interacting with Welcome. Live Supabase/Google, GPS,
compass, Maps, camera and routes remain subject to the existing field UAT needs.

## AU01/AU02 authentication UI — 2026-10-20

Implemented on `feat/auth-clean-explorer-ui` from latest `origin/main` at
`84d1dee` (merged PR #14). The supplied approved design, implementation plan,
HTML and valid 706×1600 Sign In/Create Account PNGs are preserved under
`docs/design/clean-explorer/auth-kickoff/`. See
[authentication design and deliberate variations](design/clean-explorer/AUTHENTICATION.md).

Both modes retain the existing `/sign-in` route and use real installed HeroUI
Native fields and buttons with UniWind utilities and existing CSS tokens. The
original Welcome SVG is shared without changing its language/persistence flow.
A modest mint scenic hero sits above a growing white Surface through the bottom
safe area; there is no floating mint gap. Native logical-unit typography,
scrollable keyboard-aware composition and wrapping content replace reference
pixel measurements. The generated sample photograph, populated sample email,
Create Account drag handle and back affordance are deliberately absent; Welcome
completion removes the only plausible unauthenticated return destination.

Supabase submission, schemas, auth-error codes, restoration provider, root guard,
onboarding provider, route files, native config and dependencies remain intact.
Only email is trimmed; passwords remain unchanged, including spaces. Sign-in
accepts any nonempty password; registration retains 8–128 characters. A new
synchronous guard prevents repeated calls and mode changes during pending submit.
Successful signup without a session clears password and displays localized email
confirmation; actual session state remains responsible for protected navigation.
Busy/errors/validation/confirmation and new labels render from EN/KO/JA resources.

TDD evidence: shared scenic/credential interfaces first failed before their files
existed. A behavioral test against the old real screen demonstrated **two auth
calls from two presses before React flushed busy state**, then passed with the
ref guard. Expanded real-screen tests first failed on duplicated sign-in/signup
calls and missing field error styles; layout tests first failed on missing locale
headings and keyboard composition. Tests use real HeroUI Native, actual SDK
AuthApiError/AuthWeakPasswordError/AuthRetryableFetchError classes, actual locale
resources and i18next. Native rendering and Supabase are mocked boundaries.
Coverage includes normalization, registration length limits, failed credential
retention, busy inputs/toggle/mode switch, explicit retry, known/unknown failure
localization and language changes, no-session confirmation and re-entry, session
response handling, mode-specific copy, safe-area/scroll composition and no auth
submission on mount/language change/remount. Existing Welcome and root navigation
regressions pass. Pre-review focused auth/onboarding run: **87 tests / 8 files passed**.
The review-fix credential-field run passed **8 tests**, including the new
regression for typography on actual HeroUI Label.Text.

Final checks:

- `npm run check`: passed typecheck, zero-warning lint, **497 tests / 49 files**.
- `npx expo install --check`: passed, dependencies up to date.
- `npx expo-doctor`: passed **21/21** checks.
- `npm run check:android`: passed existing Android configuration assertions.
- `npm run export:android -- --max-workers 2`: passed Metro/Hermes Android export,
  **7.1 MB** bundle. This is not an APK build.
- `git diff --check` and `git diff --check 84d1dee..HEAD`: passed.

No Edge function, limiter or migration changed, so Edge/limiter checks were not
rerun for this UI work. No additional network or paid provider path was added.

Android APK/device/UAT: **NOT TESTED**. No `adb` executable is available; no APK
was built or installed, no native screenshot captured, and no live Supabase auth
was exercised. The reference PNGs were inspected, and composition was checked
against the approved spec; no rendered Android pixel comparison is claimed.
Before client UAT, verify keyboard and action reachability on both modes; short
screen and 150% text; EN/KO/JA glyphs/wrapping; TalkBack labels/status/busy state;
show/hide and autofill; rapid presses; offline error/retry; live signup/no-session
email confirmation; restoration, protected Back and sign-out; safe areas and
system bars. Existing Google/GPS/compass/camera/routes field-validation needs
remain unchanged.

Independent review of `84d1dee..6f63147` found no Critical/Important defects and
two minor issues. Both were corrected before publication: font classes now target
HeroUI Label.Text, with a regression that failed before the fix and passed after;
the shared scenery file's extra EOF blank line was removed. After these changes,
`npm run check` passed **497 tests / 49 files**, typecheck and lint; the
Metro/Hermes Android export passed again (7.1 MB), and the whole-branch whitespace
check passed. No findings were deferred. The reviewer did not rerun the suite
or claim native device validation.

## Profile & Settings — 20 October 2026

Implemented S01 from the owner's kickoff against `main` at `3a3f770` (PR #15
confirmed merged). The Profile tab and parent `/settings` route share one content
surface. Navigator reducers retain the originating tab through stack Back, while
Profile and stack Settings each suppress their redundant native header. Existing
SettingsProvider persistence, preferences schema, auth/session provider and
protected navigation remain authoritative. No dependency, native configuration,
Edge function or provider request path changed.

The real HeroUI controls share an explicit draft, including non-preset integer
radii such as 123 m. Save is disabled for pristine/invalid/pending drafts and
suppresses repeated presses synchronously. Tests cover actual storage writes,
success after completion, failure/retry, locale changes, abandonment on blur,
external preference changes, pending Save across blur/refocus and route unmount,
known/unknown sign-out failures, real account/version and missing-data fallbacks,
cache clearing/protected Sign In after sign-out, device Settings failure/recovery,
localized Back, and zero network/sensor/permission work through local lifecycle
events. Tests use actual locale resources, HeroUI components, SettingsProvider,
AuthProvider, RootNavigation and the installed Expo Router focus hook, with
native/storage/Supabase/navigation-renderer boundaries replaced.

TDD evidence: route tests failed on the missing shared entries and duplicate
headers; old-screen integration tests failed on pristine/invalid Save, repeated
writes, external-save synchronization, retained success after new edits and
abandoned tab drafts. Account/actions tests initially had 7 failures; literal
Korean/Japanese Back and device-error assertions exposed missing resources.
These now pass. The original settings locale tests were moved/expanded into
`profile-settings-flow.test.tsx`.

Independent review found one important regression: icon/theme imports in shared
location status prevented two existing native lifecycle suites from collecting.
The themed device-settings rendering now lives in the settings feature, with an
optional render callback reusing the existing action. The reviewer reran both
location suites: **39 tests passed**, with no remaining Critical/Important
findings. Its suggested delayed-save coverage was added. Full lint also caught
React compiler purity/effect violations; draft synchronization now uses conditional
derived state, and ref/fixture writes occur outside rendering.

Final verification:

- `npm run check`: passed TypeScript, zero-warning ESLint and **534 tests / 51 files**.
- `npx vitest run src/features/settings src/features/location/location-status.test.ts src/features/location/permission-lifecycle.test.ts`:
  **80 tests / 6 files passed**.
- `npx expo install --check`: passed; dependencies are up to date.
- `npx expo-doctor`: **21/21 passed**.
- `npm run check:android`: passed the existing Android configuration assertions.
- `npm run export:android`: passed Metro/Hermes export. Repeated after the final
  code corrections with `npm run export:android -- --max-workers 2`: passed,
  **7.2 MB** Android bundle. This is an export, not an APK build.
- `git diff --check origin/main`: passed, including supplied-reference whitespace
  normalization. The root checkout and its untracked kickoff archives are unchanged.

No Edge/limiter/migration changes were made, so those checks were not rerun.
No Android APK was built/installed, no native screenshot captured and no live
Supabase/Google/GPS/compass/camera/route testing performed. `adb` is unavailable.
Native layout, keyboard, TalkBack, 150% fonts, small-screen/CJK wrapping and
system insets remain **unverified on device**. The renderer tests do not run
native layout and cannot establish visual fit. See the concrete Android checklist
and intentional Stitch differences in
[Profile & Settings](design/clean-explorer/PROFILE_SETTINGS.md). Completion of
screen implementation does not establish integrated field readiness or UAT.

## UAT refinement — sensor diagnostics (2026-10-20)

Removed development-only camera/location JSON panels and the temporary sensor-startup trace. User-facing GPS, permission, accuracy, compass and tracking recovery remain in their existing paths. Regression tests exercise development-mode camera permission guidance and GPS loading/timeout without diagnostic fields. Targeted camera, AR discovery and location tests pass (72 tests); lint/typecheck are recorded with the batch results below. Camera/GPS behavior on an Android device remains unverified in this refinement session.

## UAT refinement — compact Home chrome (2026-10-20)

The brand header uses one line and a 56 dp minimum instead of 64 dp. Floating controls use two 48 dp rows with one 8 dp gap and 16 dp vertical padding (120 dp), replacing three rows with two gaps (176 dp). At default text size with both rows fitting, combined chrome drops from 240 to 176 dp: approximately **64 dp reclaimed**, excluding unchanged safe-area insets. This is a code-derived comparison, not a device measurement; long translations and scaled fonts can wrap. Recenter retains a localized accessibility label and a 48 dp icon target. Controls remain scrollable in short scenes. Existing measured padding, map-readiness gating, animated credit occupation and settled route-fit geometry are preserved.

Home controls, map lifecycle/cost/geometry, sheet and app-shell suites pass (68 tests). Android checks still needed: compact/large text and Korean/Japanese layouts; Settings, Search, AR, Destinations and Recenter access; expanded/collapsed sheets, route visibility and Google logo/legal credits.

## UAT refinement — activation radius interaction (2026-10-20)

Confirmed installed HeroUI Native 1.0.10 supports `step`, `onChange` and `onChangeEnd`, preserves unsnapped controlled numeric values, and fires completion for both drags and track taps. Previously every 1 m update changed the Settings draft and rerendered its parent. The slider now uses 10 m detents and locally updates its displayed value/input, committing to the parent only at interaction end. A regression drives the real installed Slider gestures: three drag updates produce zero parent renders, and release produces one. Presets and numeric edits still update the unsaved draft immediately; exact integers such as 123/127 remain valid. Accessibility steps move to the next/previous 10 m detent. A focus-keyed control discards unfinished local gestures when leaving Settings. Save/persistence and focus restoration remain explicit.

Targeted radius and real Settings screen/provider suites pass (41 tests), including taps, endpoints, presets, invalid input/recovery, precise entry, delayed/failed Save, saved-state restoration and abandoning a drag on blur. Android smoothness, track tapping inside the ScrollView, numeric keyboard, TalkBack increments and persistence after app restart still require device testing.

## UAT refinement — Reanimated render warning (2026-10-20)

The installed Gorhom 5.2.14 `useReactiveSharedValue` writes `.value` during render when its primitive input changes. With `animateOnMount={false}`, AR's controlled index is that input, so expanding to index 1 reproduced three direct render-path writes across expand/collapse/resize. Enabling the SDK's default layout-aware mount behavior keeps its initial seed at -1 and applies controlled index updates through native layout/effects. No logger suppression or dependency patch is used. The AR dock can now animate into view on entry; controlled expansion and logical preference across one-detent viewports are retained.

The native test driver imports the installed JS hook and records direct `.value` assignments. The regression fails before the change and records zero such writes afterward; delayed-readiness, viewport and expansion tests pass. AR dock/discovery and Home map/sheet targeted suites pass (97 tests). This does not exercise Reanimated's real UI runtime; confirm the warning is absent during AR entry, POI selection, expand/collapse and rotation on Android, including cold entry with a cached selection.

### Final refinement batch validation

- `npm run check`: passed strict TypeScript, ESLint with zero warnings, and **540 tests in 51 files**.
- `npm run export:android`: passed Metro compilation and Android Hermes bundle export (2,634 modules). This is not an APK build or device validation.
- `git diff --check`: passed. Independent code review found no confirmed runtime regression; the installed Gorhom version reference was corrected to 5.2.14.
- No dependencies, native configuration, Edge Functions or provider request authority changed. Original untracked kickoff artifacts were left untouched.
- Still required on a real Android device: Home controls and Google credits with both dock detents, long translations and large text; radius drag/tap smoothness, keyboard and TalkBack, Save/restart restoration; clean camera/GPS fallback UI, AR cold entry with cached selection and delayed native layout, expansion/rotation, and absence of Reanimated render warnings. No physical-device, GPS/compass accuracy or live provider-integration claim is made for this batch.

## Screenshot-driven Home polish (2026-10-20)

The supplied Android screenshot showed three stacked bands above the map and a nearly half-screen collapsed sheet with unused white space. The collapsed height was 65% of its maximum, regardless of content. Home now integrates the existing compass mark into a white Search Nearby pill, removes the standalone navigator header/top Settings action, and keeps AR/catalog shortcuts in a smaller horizontally scrollable row. Profile remains the settings entry. Explore owns top/left/right safe area; the tab navigator continues to reserve the bottom inset once.

The nearby dock now peeks at 156 dp (264 dp for a selected place), scaled by system font size and capped by available geometry. For a 540 dp sheet cap, the previous nearby peek was 351 dp: **195 dp less sheet occupation** at normal text size, plus removal of the 56 dp standalone header. These are code-derived sizes, not device measurements. The visible map gains depend on viewport, text scale and sheet state. Request-limit helper text is revealed on expansion; localized loading/error/GPS recovery, provider attributions and walking warnings remain available. Expansion uses a small accessible chevron, Close is quieter, and Details/Walk share a wrapping action row.

A 48 dp Recenter button sits at the map's lower right, 16 dp above the dock. It consumes the same native shared position as the sheet, avoiding frame-by-frame React updates. Expanded geometry reserves a 64 dp map strip; attribution padding continues to follow sheet movement while route fitting waits for settled geometry. Tests reproduce the original oversized peek and header, and cover source wiring, UI-thread position updates, route/cost invariants, large text, short viewports and localized expansion.

Follow-up validation: `npm run check` passed strict TypeScript, ESLint with zero warnings and **544 tests in 51 files**; `npm run export:android` passed Metro/Hermes export (2,634 modules); `git diff --check` passed. Independent review found no confirmed regressions. No dependencies, provider contracts or native configuration changed. A physical Android preview was unavailable (no attached-device tooling), so visual polish, shadows, touch/drag feel, Recenter placement through rotation/expansion, Google legal controls and large-text translations still need an on-device pass. This is not an APK build or a claim of live Maps/GPS validation.

## Cohesive Maps / Directions / AR refinement — shared map foundation

Home and Walking Directions now resolve one reusable Google map style from `global.css`: light neutral land, subtle parks, restrained blue water and distinguishable roads. Street/place labels and required Google credits remain enabled. Home renders behind the status bar and offsets only its floating controls. A focus-owned expo-status-bar entry releases on blur; a dark-icon root default covers the light non-map theme. SDK 57 uses Android edge-to-edge by default; no deprecated status-bar color/translucency flags or native changes were added.

Focused Home, preview and status-bar suites pass (91 tests), along with TypeScript and scoped ESLint. Preview edge-to-edge and its moving dock are completed in the subsequent change. Android visual colors, status contrast and cutout/gesture-navigation geometry remain unverified on a device.

### One-action walking directions

Removed Home's separate Routes observer/request, polyline/summary flow and obsolete route-generation labels. Home, Details and AR now use the existing dedicated preview intent. New explicit intents can reuse a successful matching provider/destination snapshot within the existing transient lifetime; pending, failed, expired and different-place sessions cannot provide that result. Preview freshness, single-use authority, submitted endpoints, error recovery and auth clearing remain intact. Obsolete Home route-fit tests were retired with that presentation; retained map-credit/selection/lifecycle tests now assert zero Home Routes calls, while route fitting and request regressions exercise the dedicated preview. Focused map, preview, handoff and lifecycle suites pass (120 tests). Physical routing remains unverified.

### Directions map and expandable dock

Replaced the conventional inset header/fixed information panel with a floating safe-area header over an edge-to-edge map and a Gorhom dock. The font-scaled collapsed summary includes destination, duration and distance; expanded scrollable content includes submitted-origin context, full destination fields, actual warnings and Details/Map actions. Current sheet occupation updates legal-credit padding while settled geometry triggers fitting. Fit/Recenter follow the native shared position; the map and polyline are retained during drags, detent changes, GPS updates and resizing. Controlled index uses the layout-aware mount path, retaining logical expansion across a one-detent viewport. Over-drag is disabled to protect floating controls. Focused directions/AR/navigation tests pass (160 tests), including delayed GPS ownership, snapshot reuse, drag-vs-settle fitting, short viewports, large fonts and zero render-time SDK index writes. Android gesture behavior remains unverified.

### AR presentation and final review fixes

The AR header now uses one compact high-contrast control row, camera labels use white text on dark/green surfaces, and the font-scaled dock peek is 144 dp instead of 176 dp. Automatic nearest selection stays compact; manual selection and incoming handoffs still expand. Fallback list, actual provider metadata, explicit Scan/Details/Directions authority and sensor lifecycle remain intact. AR owns light status icons only while focused.

Review reproduced two issues before fixes: completed route snapshots could be reused across provider-request languages, and requesting sheet expansion could overwrite the animated position/report settlement before native motion completed. Successful sessions now record actual acquisition language (including delayed GPS); only a new explicit action can obtain another locale's route. Layout synthesis is limited to initial/changed geometry in Directions and AR; native position and settle callbacks own index transitions. Focused preview/AR regressions pass (100 tests), including the two failing-before-fix paths. Home's separate settled-index path was inspected and does not have the request-time transition issue.

### Whole-batch validation

- `npm run check`: passed strict TypeScript, ESLint with zero warnings and **553 tests in 52 files** on the final code tree.
- `npm run check:android`: passed Android-only SDK 57 configuration, Maps injection, permissions and EAS APK profile checks.
- `npm run export:android`: passed Metro/Hermes export (**2,639 modules**); this is not an APK build.
- `git diff --check`: passed. Independent review's cache-language and premature-settlement findings were reproduced, fixed and rechecked; no confirmed findings remain.
- No dependencies, native configuration, provider contracts, Edge Functions or persisted provider data changed. Other worktrees and original untracked kickoff artifacts were preserved.
- Still unverified on a real Android device: status-bar/map edge-to-edge contrast, cutouts and gesture navigation; map colors and Google logo/legal visibility at both dock detents and while dragging; route framing, Fit/Recenter and Back/Details navigation; small screens, large fonts and English/Korean/Japanese wrapping; AR outdoor label readability, camera/list selection and native sheet smoothness; GPS/heading/camera permission lifecycle and absence of render warnings; live Places/Routes request counts. No APK was installed and no physical sensors or live providers were field-tested in this session. Existing Settings slider drag/tap, TalkBack and Save/restart manual checks also remain pending.

## Android map startup crash follow-up (2026-10-20)

The reported Android Fabric stack fails in `MapViewManager.optionsForInitialProps` when it reads `userInterfaceStyle` as a String but receives a `ReadableNativeArray`. The refinement had introduced the explicit `light` override on both interactive maps. Removed that non-default override from Home and Directions, retaining the shared custom style and the SDK's native default. The installed MapView JS fallback is `system`, matching its generated C++ default; the generated diff emits this enum only when it differs from that default, so this workaround avoids the changed initial-prop path without a native patch, dependency change or rebuild requirement. Physical testing subsequently showed the system default can produce a dark map; the earlier claim of a native light default was incorrect.

Both real screen regression suites failed before removal because they still passed the unsafe override, then passed afterward (88 tests). They verify the custom style, route and map geometry remain intact. These tests mock MapView: they guard the app's prop contract but cannot reproduce the APK's native array conversion or prove crash-free Android startup. The exact array-producing conversion in the reported APK has not been reproduced locally. Cold Explore entry and opening Directions still require confirmation on that Android build, including a device in dark mode. Google SDK default reference: https://developers.google.com/maps/documentation/android-sdk/configure-map.

Follow-up checks: `npm run check` passed TypeScript, ESLint with zero warnings and **553 tests in 52 files**; `npm run check:android` passed; `npm run export:android` passed Metro/Hermes compilation (2,639 modules); `git diff --check` passed. No APK/device verification was performed for this workaround.

## Fixed-scene refinement — AR camera

Moved camera ownership out of the discovery overlay into a separately measured, full-screen scene. Safe areas now apply only to overlays; the camera mounts only with positive explicit dimensions and preserves those bounds through blur/refocus and transient zero layouts. Regression coverage exercises expanded navigation return, independent overlay measurements, attribution appearance, background return and real scene resizing while preserving request counts and permission behavior. The earlier screen tests did not assert native camera dimensions. The Android-native cause of the reported squashing has not been reproduced locally; these tests guard the new sizing contract rather than prove physical preview rendering.

## Fixed-scene refinement — maps

Home and Directions now measure their full scene independently from the shorter native MapView. Each scene shares one collapsed peek calculation with its dock, and native map height is scene height minus that peek. Expanded occupation changes only overlay placement and overlap-based Google attribution padding, avoiding double reservation of the peek. Directions no longer fits on sheet settlement or refocus; automatic fitting is keyed to route identity and actual native layout, while explicit Fit retains settled visible-area geometry. Readiness, cached route snapshots, selection and paid-request authority remain unchanged.

Regressions failed before the change for the missing fixed-frame contract and unwanted settlement-triggered route fitting. Focused map, dock and preview suites pass (104 tests), including both detents, native map identity, measurement-loop prevention, focus return, explicit Fit, large fonts, short screens and attribution padding. A short-screen regression also reproduced top padding beyond the new map frame; padding is now bounded. The accepted JavaScript-only limit is that SDK attribution padding can still shift the map's visual center slightly. No native patch, dependency or configuration change is included.

### Fixed-scene batch verification

- `npm run check`: passed TypeScript, ESLint with zero warnings and **559 tests in 52 files**.
- `npm run check:android`: passed; `npm run export:android`: passed Metro/Hermes export (**2,640 modules**).
- Targeted AR/navigation coverage passed (62 tests); map/dock/preview coverage passed (104 tests); the real installed Router startup suite passed (6 tests) after supplying scene layout events, retaining delayed navigation readiness and GPS/compass cleanup assertions.
- `git diff --check` passed. Fresh-context whole-change review found no confirmed important regressions.
- Still required on Android: expand AR, navigate to Home/Details/Directions and return repeatedly; compare camera proportions before/after, background/resume and permission recovery; inspect both maps through drag/expand/collapse, initial and manual Fit/Recenter, attribution, small screens and large fonts. Camera preview proportions, native map pixels/zoom and gesture smoothness are not verified by renderer tests or export. No APK was built/installed; the accepted attribution-padding center-shift limit remains.

### Android native preview distortion — 2026-10-20

USB reproduction on Samsung Galaxy A53 (SM-A536E), Android 16/API 36, 1080×2400, density override 420 dpi and font scale 1.1, using the development client with Metro from `refine/uat-readiness`:

- AR → Place Details → Android Back with the nearby sheet expanded reproduced distortion. The outer ExpoCameraView and CameraX PreviewView remained 1080×2400. SurfaceFlinger showed the actual camera SurfaceView content reduced to 1080×1080 with unequal scales (1.3333 and 0.7500), compared with uniform 1.6667 scaling before navigation. Restarting the camera after navigation restored uniform scaling. Full-frame mocked component tests did not catch this native failure.
- `expo-camera` 57.0.6 now initializes PreviewView with CameraX `ImplementationMode.COMPATIBLE` (TextureView), which supports composition through animated navigation. Existing focus/foreground unmounting and full-scene bounds remain intact. Expo autolinking explicitly builds this module from source instead of its bundled Maven artifact.
- Dependency changes are stored in `patches/` and applied by a dependency-free Node postinstall runner. Versions and every replacement are validated before any writes; repeated installation is supported and mismatched source/version fails closed.
- The installed-source regressions failed before the patch, then passed. Camera, patch-installation and source-contract suites passed (14 tests). Typecheck/lint passed. Native compilation and post-fix device verification are pending the rebuilt development APK; these source checks do not establish rendering correctness.

### Android map padding camera movement — 2026-10-20

The same USB session confirmed Home's MapView and inner renderer remained 1080×1743 in both sheet states (scene height 2193, collapsed peek 450 physical pixels). Landmarks retained their size but shifted upward when expanding. `react-native-maps` 1.27.2's `applyBaseMapPadding` restored the old camera target after changing the padded region, causing the movement. The earlier description of a merely slight center shift understated the visible failure.

The version-checked Maps patch now updates base padding directly through `GoogleMap.setPadding` without `moveCamera`, including deferred application. It retains base-padding bookkeeping and defers safely when GoogleMap/layout is unavailable. Explicit camera commands and coordinate fits remain unchanged. Both Home and Walking Directions use this shared native path; attribution follows the moving sheet while the native map frame stays tied to the collapsed baseline. Source-contract regressions failed before the fix for immediate/deferred movement and missing readiness guards. Post-fix physical rendering and attribution checks require the rebuilt APK.

Whole native-fix validation: `npm run check` passed typecheck, lint and 568 tests across 55 files. Focused Maps/source/patch-install suites passed (98 tests). `npm run check:native-patches`, `npx expo install --check`, `npx expo-doctor` (21/21), `npm run check:android` and `npm run export:android` all passed. Expo resolver output includes `configuration.buildFromSource: ["expo-camera"]`. These checks precede the native APK build and do not claim post-fix physical-device success.

Delivery evidence: camera commit `3e01949`, Maps commit `ccda6c5`, pushed to `refine/uat-readiness`. Independent native-patch review found no confirmed issues. GitHub run https://github.com/mjfelecio/ARgala/actions/runs/39447042665 passed clean installation, whole-app checks, Edge checks/lint, Expo dependency/Doctor checks, Android config/export and PostgreSQL limiter tests.

Development build https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/a344e965-f8b3-447f-9261-1a74941e7001 was submitted from `ccda6c5` with the existing remote signing credentials and development environment. EAS remained `IN_QUEUE` without compilation logs or a wait estimate for over 15 minutes. No replacement APK was available for installation at this checkpoint. The currently installed APK was backed up outside the repository; app data was not cleared. Native compilation and post-fix device acceptance remain pending, specifically: verify remote installation applies both patches and compiles expo-camera from source; install the rebuilt APK in place; repeat AR → Details → Back using both Back actions and sheet states; inspect TextureView proportions/performance, tab/background cleanup, stationary map landmarks, Google credits, and route Fit/Recenter/cache restoration. Unit/source tests and the earlier native failure capture do not establish post-fix physical rendering success.

### Installed APK and camera transition follow-up — 2026-10-21

The development build above finished and was installed in place on the Galaxy A53 at 08:39 local time. The installed APK contains the patched CameraX TextureView and Maps padding implementation. TextureView alone did **not** resolve AR → Details → Back: both outer views remained 1080×2400, but the inner 1440×1080 texture returned with scale 1/1 and zero translation. Invoking CameraX's preview redraw as a temporary debugger experiment restored the normal crop (scale 1.25/2.2222223, translation X −360). That experiment was diagnostic only and is not part of the fix or acceptance runs.

AR now waits for the parent native stack's opening `transitionEnd` before restarting its camera. Focus returns earlier, while the native scene is still appearing. Full positive scene bounds, blur/background unmounting, permission checks and sensor ownership are preserved. On the same installed APK with the current Metro bundle, both Android Back and the Details screen's Back restored the normal texture crop with the nearby sheet expanded. Tab return, background/resume and one immediate Back → Home → app-resume sequence also retained full bounds and the normal crop. These observations cover this phone and the attempted timing; they do not prove every canceled or interrupted native transition. Location freshness correctly showed fallback guidance during the debugger session; this was not an outdoor GPS/heading accuracy test.

The SDK 57 Router warning came from initial URL resolution calling `onUnhandledLinking` from work started during render. A version-checked JavaScript dependency patch moves notification to the committed effect and retires pending callbacks on cleanup, while retaining initial-state parsing and live-link handling. Thirteen tests exercise the real installed hook, including abandoned Suspense renders, synchronous/asynchronous URLs, StrictMode, remount and live links; six failed against the pristine SDK. One Metro reload and one process cold launch on the phone emitted zero matching pre-mount state-update or render-time shared-value warnings in their observation windows. No warning suppression was added.

Verification: `npm run check` passed TypeScript, zero-warning ESLint and **584 tests in 56 files**. Focused AR/discovery/installed-Router startup coverage passed 57 tests; independent review passed 120 targeted Router, AR and map/directions tests with no confirmed findings. `npm run check:native-patches`, `npm run check:android` and `npm run export:android` passed. The camera and Router follow-up changes are JavaScript; they do not require another APK after the installed native build. Still required for UAT: other Android devices/sizes, prolonged navigation and canceled transitions, outdoor sensor accuracy, permission revocation, route-provider acceptance, language/font scaling, and sustained camera performance/heat.

### Rounded map-dock corner coverage — 2026-10-21

Home and Directions share a 24 dp (about 1.5 rem) extension beneath the collapsed dock, replacing the initial 5 dp experiment after device feedback. Native attribution padding and explicit route-fit geometry reserve the same overlap; expansion still cannot resize the map or automatically refit a route. On the Galaxy A53, Home's native map measured 1080×1806 in both collapsed and expanded states. Screenshots showed the rounded corners backed by map content, visible Google credits following the dock and stationary map landmarks. The corresponding frame/padding regressions failed against 5 dp (13 failures), then all 91 map/route tests passed at 24 dp. The whole check again passed TypeScript, lint and 584 tests. Directions uses the same tested geometry; a live Directions corner/route-fit pass remains part of device UAT.


## Application-wide UI audit — native light map (2026-10-21)

The Galaxy A53 audit reproduced a dark Google renderer behind dark status icons on both Explore and Directions with Android in dark mode. A temporary React Native app-level Appearance override did not change Google Maps; that experiment and its bootstrap test were removed. Maps 1.27.2 explicitly selects `FOLLOW_SYSTEM` for the default system style. Its existing version-checked dependency patch now selects `MapColorScheme.LIGHT` for that default, matching the approved light-only application. JavaScript keeps `userInterfaceStyle` unset because the explicit light enum previously crashed Fabric initial-prop conversion.

The new installed-source contract failed against the original branch, then passed after applying the patch. Native patch/install/destination regressions passed (35 tests); Expo install compatibility, Doctor (21/21), Android config and Android export passed. Whole-app validation on the current remediation tree passed TypeScript, zero-warning lint and 601 tests in 57 files. These source/export checks do not prove the new native map color. The rebuilt APK/device results are recorded below.


### Shared recovery presentation

Shared bootstrap/location/camera notices and actions now use existing HeroUI/UniWind tokens rather than the old blue native Button/default-font styling. Polite announcements, callbacks, disabled state, translated children and scroll layout remain intact. The real LocationStatus/error mapping tests cover known timeout, unknown sanitized fallback, explicit Retry and recovery. Focused shared/location suites passed 43 tests; the whole remediation check passed 601 tests with typecheck/lint. On the Galaxy A53 at 1.6 text scale, disabled device location displayed the mint guidance and green Retry in the retained map dock. Location services and font scale were restored afterward. The final sweep rendered revoked-camera guidance, opened native permission UI through explicit Allow camera, and restored preview. Repeated native denial/settings revocation remain manual UAT.


### AR heading readability

The camera header preserves full title and compass/approximate-bearing guidance, uses a shorter translated visible Scan label, and moves guidance above Map/Scan when text scale/available width needs it. Accessibility retains the existing full Scan / Refresh label and busy/disabled semantics. Camera geometry, heading validation, projection and request handlers are unchanged. Three EN/KO/JA enlarged-guidance regressions failed with the old one-line clamp, then the shell/AR suites passed (67 tests). The Galaxy A53 showed complete English compass-unavailable and approximate-bearing text at 1.1 and 1.6 scale, with accessible Map/Scan controls; Back returned to Explore. The 1.6 tab-label spacing concern did not reproduce on the settled screen. Korean/Japanese headers also rendered fully at 1.1 and 1.6; English was checked at 320 dp width / 1.6. Original English/font/viewport restored.


### UI audit rebuilt APK acceptance — 2026-10-21

EAS development build [aa63d13d-0095-4ade-9c67-76169b1c0501](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/aa63d13d-0095-4ade-9c67-76169b1c0501) finished from `276aad4`; APK SHA-256 `220aba05cd8c5c873c8fa731caa4f7c38ea89509d4d71d70c46b692667503346`. Non-streaming `adb install -r` succeeded in place on the same Galaxy A53 (package update 11:20:12), preserving the existing session/preferences. Under dark Android, Explore and Walking Directions now show the light Google renderer and readable dark status icons. Explore remained light under light Android; original dark mode restored. Explicit Search returned 20 places; AR reused results, selected/expanded a place, opened Details and restored camera preview on Back. A live Directions preview completed with distance/duration; Sheet drag and return were exercised; explicit Fit framing remains manual UAT. This does not establish outdoor accuracy, prolonged performance or every native transform/timing case.

A read-only inspector observer deduplicated Network events by request ID: one explicit Search produced one unique nearby POST; subsequent Profile/refocus, background/foreground and AR entry added zero Places/details/routes requests in that window. No bodies, headers, tokens or coordinates were logged. This observes client request authority, not server billing. Radius input 9 m showed validation and 500 m preset cleared it; slider drag changed 500 to 850 m and was restored to 500 m. Open device settings reached Android InstalledAppDetails and Back restored Profile; EN/KO/JA saves worked and original English/500 m restored. Font scale 1.1, full 1080×2400, original 420 dpi override, enabled location services and camera/location grants retained/restored. TalkBack, fresh-account flows, repeated denial, approved-content paths and outdoor field scenarios remain explicit UAT gates in [the audit](audits/argala-ui-ux-audit.md).

Final implementation validation: `npm run check` (typecheck, lint, 601 tests / 57 files), `npm run check:native-patches`, `npx expo install --check`, `npx expo-doctor` (21/21), `npm run check:android`, final `npm run export:android`, and `git diff --check` passed. Independent review found no confirmed important/critical issues and separately passed 51 targeted tests. No Edge code changed. See the audit for before/after crops, severity, boundaries and manual acceptance steps.


### Requested compact header and Home controls — 2026-10-21

AR now displays only the rounded degree value (for example, 132°) in EN/KO/JA. Missing heading displays a single dash with the existing translated Compass unavailable accessibility label; detailed sensor guidance remains in its existing fallback content. The Home Featured Destinations shortcut adds an existing Ionicons landmark/library outline, and Search Nearby reduces its minimum height from 56 to 48 dp with tighter vertical padding. Request handlers, disabled/busy states and sensor ownership are unchanged.

Updated real-locale regressions failed in all three languages before the heading change, then 59 targeted shell/AR/Home tests passed. `npm run check` passed TypeScript, zero-warning lint and all 601 tests / 57 files; `git diff --check` passed. ADB briefly disconnected during reload; after reconnecting/restoring port forwarding and reloading the current bundle, the Galaxy A53 rendered 132° without a qualifier, the landmark icon and a measured 126 px / 48 dp search surface at its existing 420 dpi configuration. No new native build was required.

### UI hierarchy refinement — 2026-10-21

Built on fetched `origin/main` (`701a225`): compact AR/Directions headers, structured sheets, opaque map controls, white Details/Settings surfaces and supported native marker callout content. The baseline Load Details action successfully returned the same display contract already supplied by Nearby; complete matching-language discovery data now suppresses redundant requests across Home/AR/Details and destination-nearby handoffs. Explicit missing/expired-details recovery retains loading, success and sanitized error feedback. No backend masks, native dependencies, sensor rules or preference persistence changed.

`npm run check` passed TypeScript, zero-warning lint and **611 tests / 57 files**. Android config, native patch verification, final Android export, Edge typecheck/lint and diff whitespace checks passed. Independent review's destination-handoff omission was fixed and covered; follow-up reported no further findings. Full investigation, screenshot comparisons, regression details and device boundaries are in [the refinement report](audits/2026-10-21-ui-hierarchy-refinement.md). Genuine photo integration is deferred to [ticket #19](https://github.com/mjfelecio/ARgala/issues/19).

Before the user requested continuing without ADB, the Galaxy A53 rendered the new AR hierarchy/camera, complete real Details without a redundant load action, a live walking route with expanded sections and explicit Fit, the native custom callout and the final outlined 500 m Settings field. Radius draft was restored without saving. USB resets interrupted parts of the session and a later reconnect attempt; no device request-count guarantee, exhaustive sensor/permission acceptance, enlarged-text/locales sweep or new refinement APK acceptance is claimed. A separate clean-`origin/main` presentation preview finished successfully; see the report for its APK/build links. That preview has not been installed or tested here.

Final follow-up: the connection recovered long enough to reopen the final bundle, Search 20 real results and render AR results/nearest summary. The user confirmed the dark camera was facing a surface, then reported the phone had shut down on low battery and requested finishing without ADB. Additional navigation/settings checks were not completed. [PR #20](https://github.com/mjfelecio/ARgala/pull/20) is open, unmerged; [clean CI run 39557606570](https://github.com/mjfelecio/ARgala/actions/runs/39557606570) passed installation, whole-app/Edge checks, Expo compatibility/Doctor, Android config/export and PostgreSQL limiter tests against `e7df32d`. The follow-up documentation commit changes no runtime code.

### PR #20 review follow-up — bounded Details reuse

Confirmed the Codex P2 finding: observed Nearby queries survive garbage collection and were accepted as complete regardless of response age. Reuse now checks the original `dataUpdatedAt` against `AR.nearbyReuseMs` for both Nearby and Details. Seeding Details and navigation handoffs preserve the source timestamp; stale destination-nearby results remain summaries without acquiring complete-details status. A newer genuine response can replace an older handoff. AR's explicit recovery guard uses the same age rule so an expired cache entry cannot block the visible action.

Four screen regressions failed before the age fix; an additional handoff regression caught timestamp renewal during navigation. Final `npm run check` passed strict TypeScript, zero-warning ESLint and **616 tests / 57 files**; focused Places/AR/destination/Home coverage passed 142 tests before the final timestamp propagation changes, which the full suite also covers. Tests use real query observers and application cache defaults, covering observed expiry, the seeding boundary, focus/foreground, invalidation/remount and explicit recovery without automatic provider calls. `git diff --check` passed. No backend/native configuration or UI layout changed, and no additional ADB verification was attempted.

### CI compatibility follow-up — Expo SDK 57 patch releases

[Run 39792317593](https://github.com/mjfelecio/ARgala/actions/runs/39792317593) passed all 616 tests, typecheck/lint and Edge checks, then failed `expo install --check`: the current SDK compatibility metadata required Expo 57.0.31, Location 57.0.22 and Router 57.0.29. The same failure reproduced locally. These three dependencies and their lockfile are updated within SDK 57; compatibility validation remains enabled.

Router 57.0.29's pristine `build/fork/useLinking.native.js` is byte-for-byte identical to the pristine 57.0.28 version reconstructed from the installed patch. The patch is retargeted to the exact new version with unchanged transformations; version/source checks remain fail-closed. Location's patch release fixes an Android task-consumer permission-revocation crash. No app sensor rules, UI handlers or backend behavior changed. These dependency changes require a rebuilt APK for native UAT; the earlier presentation fallback APK remains the original `701a225` build.

Clean `npm ci --no-audit --no-fund` passed and applied all four patched dependency files. `npm run check` passed TypeScript, zero-warning lint and **616 tests / 57 files**, including installed Router lifecycle regressions. `CI=1 npx expo install --check`, `npx --yes expo-doctor` (21/21), `npm run check:android`, `npm run check:native-patches`, `npm run export:android`, `npm run check:edge`, `npm run lint:edge` and `git diff --check` all passed. No compatibility checks were skipped or relaxed. No APK build or additional physical-device verification was performed for this dependency update.

### Performance and sensor refinement — 2026-10-22

The dedicated `perf/sensor-responsiveness` branch starts at merged PR #20 (`e04d8eb`). Temporary ADB/React diagnostics on the Galaxy A53 found 60/63/66 AR discovery-subtree commits in three approximately ten-second development windows, taking 3.0–3.7 seconds of React rendering. Sensor events repeatedly restarted freshness timers and reached the camera parent; compass-only changes repeated geographic work. The device reported heading quality 3 with median consecutive changes about 2.32°, while GPS accuracy varied from 3–82 m. Battery saver, low charge and elevated temperature prevent representative release-performance comparisons.

Sensor state now belongs below the camera boundary, geographic ranking/list inputs follow raw GPS rather than heading, and freshness clocks run independently of sample events. JS receipt time travels with each sensor update without replacing raw sample timestamps or continuous watcher health. AR labels use an 80 ms Reanimated horizontal translation, honor reduced motion, snap reflow and clear immediately when directional validation fails. No GPS filter, relaxed quality threshold, new dependency, background tracking or provider cache/request-policy change was introduced.

Regressions reproduced 10 camera renders → 0 for ten heading samples, 10 AR interval restarts → 0, 20 distance calculations → 0 for ten headings/two POIs, and Directions interval growth 2 → 6 becoming stable for four GPS samples. Tests cover wraparound/noise, FOV exit/reacquisition, lane change, raw proximity crossings, degraded accuracy, stale/future timestamps and continuous heading traffic over expired GPS. Existing permission, focus/foreground, query cost and error/locale suites remain intact. Final `npm run check` passed TypeScript, zero-warning lint and **626 tests / 57 files**. `npm run check:android`, `npm run check:native-patches`, Expo install compatibility, Doctor (21/21), Android export and whitespace verification passed. Independent review found no important correctness issue. No Edge code changed.

At the owner's request, EAS development build [017af1ca-b867-42b8-8258-f3d83caaa45f](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/017af1ca-b867-42b8-8258-f3d83caaa45f) rebuilt merged `e04d8eb`, including Location 57.0.22. APK SHA-256 `b8b369aa1e0dba8f857b87ee72f3cdec4cc41b04f949fd0a75f50f2ebbae9341`; `adb install --no-streaming -r` returned **Success**, and Android reports last update `2026-10-22 23:39:00`. This native baseline APK does not embed subsequent performance-branch changes; the development client loads them through Metro. Session/preferences were preserved through an in-place update.

Representative before/after device smoothness, transformed label hit regions, optimized/release build measurements, outdoor GPS/heading accuracy, controlled rotations/walking, permission revocation and extended thermal/memory soak remain acceptance work. Full findings, conditions, request boundaries and follow-up scenarios are in [the performance audit](audits/2026-10-22-performance-sensors.md).

Performance follow-up: [draft PR #21](https://github.com/mjfelecio/ARgala/pull/21) is open, unmerged; [CI validation run 39807910976](https://github.com/mjfelecio/ARgala/actions/runs/39807910976) passed. The installed baseline APK checksum was verified against Android's installed `base.apk`, and the app opened with retained preferences/session and light Google Map. The optimized performance-branch [preview build e3adbf34](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/e3adbf34-2566-4a7d-8c63-4c4849ee06c4) has been submitted from `d3b00f0`; its acceptance remains pending. The phone was left with ARgala stopped and its screen off to charge from 2%. No representative FPS, memory or battery improvement is claimed.

### Foreground walking navigation — 2026-10-24

Implemented independently from merged optimization main `101e450`, without depending on the AR-card branch. Explicit Start Navigation reuses the existing completed route; foreground GPS locally advances a monotonic progress high-water mark and Turf slices the remaining polyline. Stop returns to the original preview. The existing location watcher/expiry clock, captured origin/destination, native Google user layer, map styling, Fit/Recenter, route warnings and transient query rules remain. Remaining display geometry is separate from original Fit geometry, so GPS progress does not fit/recenter the map. No recurring Routes/Places request, extra sensor subscription, snapped user marker, background navigation or persisted position history was added.

HOP-Driver reference paths and deviations are documented in [the design](superpowers/specs/2026-10-24-walking-navigation-design.md). Its immutable route/local slicing, coordinate conversion and repeated off-route observations were adapted; poor-accuracy force-snapping, vehicle camera/thresholds, automatic rerouting and snapped-endpoint-only arrival were excluded. Modular Turf **7.4.0** (`helpers`, `length`, `nearest-point-on-line`, `line-slice-along`) was installed with Expo; installed declarations and deterministic meter tests verify the newer `totalDistance`/`pointDistance` properties. No native dependency/configuration change was required.

Initial conservative thresholds: native sample age <=10 seconds; accuracy <=25 m; healthy continuous watcher sample matching the position timestamp; two time-separated acquisition samples; 3 m/s walking displacement/arc bounds with accuracy allowance and a 75 m maximum arc step; a second compatible fix for suspicious forward jumps; progress deadband max(6 m, reported accuracy); route corridor max(20 m, 1.5×accuracy); three distinct off-route readings; arrival requires two acquired accurate (<=10 m) raw readings within 15 m of both the captured destination and final route portion. Ambiguous distant overlapping portions pause progress. A large untracked gap may require Stop/Start using the same route; translated guidance explains recovery. Thresholds require real walking calibration.

Meaningful regressions first exposed an accepted 60 m route leap across a 20 m physical detour, an irreversible isolated 40 m jump at 25 m accuracy, and identical polyline array recreation after backward noise. Final traces reject the detour, keep progress at zero for the isolated moderate-accuracy spike, require corroboration before accepting sustained movement, and retain the exact native coordinates array when only bookkeeping changes. All thirteen requested trace categories are covered across the pure helper, hook, actual screen and installed-SDK focus lifecycle tests: stationary drift, walking, backward noise/walking, turns, intersections/overlaps, jumps, degraded quality, off-route/return, arrival, interruption and Stop/full restore. Query lifecycle tests use actual application defaults and prove zero additional provider requests for Start/progress/Stop/resume/language/invalidation/reconnect.

Focused directions verification passed **119 tests / 6 files**; independent final review passed **100 tests / 4 suites** and found no remaining confirmed issue after the spike fix. Full `npm run check` passed TypeScript, zero-warning lint and **673 tests / 61 files**. Expo compatibility, Doctor (21/21), Android configuration, native patch verification and Android export passed. Edge logic was unchanged. These are software/export checks, not an installed navigation APK or outdoor route test.

Device limitation: same Galaxy A53 / Android 16, existing Location 57.0.22 development client. The last attempt found secure keyguard at 4% battery; the app was force-stopped and display switched off. The device subsequently disappeared from `adb devices` before navigation UI verification. No preview APK was built. Real Start/Stop/map/sheet appearance, outdoor route trimming, signal transitions, turns/intersections/parallel paths, arrival, background recovery, prolonged resource use and threshold calibration remain physical acceptance gates. PR remains draft until device acceptance; no smoothness/accuracy/battery claim follows from mocks.


### Performance follow-up: label placement candidate — 2026-10-24

The standalone optimized preview `e3adbf34` was restored after temporary production-mode JavaScript testing. The owner reported excellent overall responsiveness but rejected both 80 ms label interpolation and the first 32 dp snapping candidate for visible jitter. Neither counts as accepted sensor presentation. The current uncommitted three-position experiment preserves raw geographic and request authority. A temporary development-client attempt bundled the candidate but a secure Android keyguard prevented visible interaction. The standalone APK was then restored successfully and checksum-verified; the temporary request diagnostic, Metro process and display-setting change were removed. See the [performance audit](audits/2026-10-22-performance-sensors.md#three-position-experiment--2026-10-24) for the reconstructed trace, verification results, startup reference and outstanding device/field gates. No new optimized APK is available for this experiment yet, and physical verification still requires the owner to unlock the phone.

The owner subsequently unlocked the device and clarified that the floating labels were fine; the changing **degree number at the top** was the actual complaint. The earlier interpretation of the feedback as label-smoothing rejection is superseded by that clarification. The current header uses display-only 10° circular stops with an 8° hold threshold; raw heading continues to drive projection and quality/freshness gates. EN/KO/JA real-header regressions failed before the change, then `npm run check` passed TypeScript, lint and **639 tests / 59 files**; Android export passed. A ten-second production-mode JS clip on the Galaxy A53 showed a steady `150°` readout; rotation feel and a new standalone APK remain pending. The stable-lane experiment was set aside to isolate this change. Temporary request logging was removed before final checks. ADB also observed camera release on Map/background and one current target GPS listener in foreground versus zero in background. See the audit for request timings, limits and test-harness recovery. The phone was returned to Map, with its original stay-awake setting, to charge from 6%; the development client and Metro remain available for readout feedback during this test session.

Runtime changes are committed as `a7ceedd` / `3b8b042` and pushed to PR #21. [Standalone preview 9b37d5eb](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/9b37d5eb-1b7b-4fe1-be2c-de09ae16420d), submitted from clean `f2d0771`, was canceled at the owner's request; EAS confirms `CANCELED`, with no artifact or new installation. Every future preview APK build requires the owner's explicit approval, recorded in `AGENTS.md`. A fresh pre-commit full check passed 639 tests plus lint/typecheck; Android configuration and native patches passed. Both source and documentation CI passed. The owner has authorized merging PR #21 after final testing and before implementing the [queued AR/navigation follow-ups](superpowers/specs/2026-10-24-client-review-followups.md). Physical rotation/field acceptance remains documented; the existing development client can exercise the committed JavaScript without another EAS build.

The final native Map/Profile check found that Home's retained Google location layer continued its own 5-second high-accuracy request on Profile. Gating `showsUserLocation` on existing screen ownership/readiness changed Profile from one target GPS request to zero in three ADB cycles while retaining the map. Full checks now pass **643 tests / 59 files** plus TypeScript/lint; Android export and independent review passed. Both original/fixed controlled cold starts survived. One earlier startup recorded a native Fabric delegate-dispatch SIGSEGV; it remained non-reproducible in the comparison and is documented as an unresolved native-runtime follow-up, not a fixed app-level defect. The phone was left stopped/screen off at low charge. No additional preview build was started.


### Enhanced floating AR information — 2026-10-24

Optimization PR [#21](https://github.com/mjfelecio/ARgala/pull/21) was merged as `101e450` before this independent feature branch. Selected or raw-radius-eligible labels now show approximate distance, selected/in-range state and actual address (or available description), while ordinary labels remain compact. Unsupported category icons and missing metadata are omitted. Selected-card inspection reuses the sheet's guarded Details handoff; manual selection and the sheet share the same provider ID. Fixed font-scaled lanes and clamped per-card widths preserve collision/safe-area bounds. Camera, sensor validity, raw FOV/radius, provider fields, request authority and cache retention are unchanged.

Meaningful red tests reproduced the missing rich geometry and selected-card inspection before implementation. Full `npm run check` passed TypeScript, zero-warning lint and **652 tests / 59 files**; Android export and `git diff --check` passed. Regressions cover real EN/KO/JA resources, absent/address/description metadata, enlarged CJK text, narrow/short viewports, stable selection, explicit Details handoff, matching cache age and zero extra Nearby/Details requests during local selection/sensor changes. Independent review found no confirmed issues. No native configuration, dependency or Edge changes require additional native/Edge checks.

ADB verification was attempted on the same Galaxy A53 / Android 16 with the existing Location 57.0.22 development client and production-mode Metro JavaScript. Repeated USB reconnects dropped the reverse tunnel and caused an Android `Unable to load script` failure before card rendering. LAN Metro was then available, but the phone was securely locked at **4% battery** (USB charging, about 37.8°C), so interaction was stopped, ARgala force-stopped and the display turned off. This does **not** establish physical appearance, bright/dark readability, camera-return behavior or outdoor sensor performance for these cards. Those remain device/UAT gates; no preview APK was built. The earlier native Fabric delegate-dispatch crash also recurred during pre-card testing and remains a baseline native-runtime investigation, separate from the bundle-loading failure.


### Combined client-review smoke and selected-only follow-up — 2026-10-24

The owner requested merging after brief page crash checks, deferring field refinement, and explicitly authorized one preview APK after all merged changes. PR #22 merged as `f6e5f49`; PR #23 merged as `a6d943d`. Their combined tree passed typecheck, lint, 682 tests and Android export before the final presentation follow-up.

On the reconnected Galaxy A53 / Android 16, production-mode JavaScript in the existing development client opened Walking Directions, returned a real 240 m / about 3 minute route, displayed the native map, expanded the sheet and preserved the process. Start Navigation briefly rendered when qualified; later GPS quality withheld it with the expected guidance, so active walking/Start/Stop was not physically established. AR opened with the 120–140° header, native camera operation (AppOps running), returned nearby results and the sheet without an observed crash in this window. The camera faced a dark surface; no physical floating-card readability/interaction claim follows. ADB reconnected repeatedly; charge fell from 3% to 2%. App was force-stopped and display switched off. The older intermittent native Fabric crash remains a runtime follow-up, not a claim of crash freedom under all conditions.

Before starting the approved preview build, the owner changed the presentation requirement: only the selected AR location may expand, and all labels should use the newer styling. Selected-only rich geometry/metadata and consistent semantic card styling preserve raw eligibility, stable provider IDs, field of view, stops and query authority. Four focused regression assertions failed against the prior presentation before the fix. Outdoor sensor/route calibration, bright/dark card legibility and sustained native stability remain deferred field work.

Selected-only follow-up verification: 76 focused AR tests and final full `npm run check` passed TypeScript, zero-warning lint and **682 tests / 61 files**. Independent scoped review found no regression. Android exit-info confirms the 08:43 and 08:46 smoke processes ended with USER REQUESTED / FORCE STOP; no new crash entry appeared for those sessions. Physical floating-card styling and active walking remain deferred.

### ACLC M1 Viro native feasibility preparation — 2026-10-25

Branch `spike/aclc-viro-native` starts from `16cd406d60cf`. The approved blueprint/plan and two lifecycle clarifications are recorded in `94ffce3`; `3fd9867` pins/configures Viro 3.0.3, and `25969bf` adds the explicit development-square flow. M1 is **prepared, awaiting specific development-APK approval and physical Gate A**, not physically complete. No downstream ring/proximity implementation or APK build was started.

The dependency's declared Expo 57/RN 0.86/React 19 peers match the installed versions. Its plugin selects AR only with no cloud provider. An actual generated-manifest regression exposed Viro's required-camera feature; a small config plugin normalizes camera/AR features to optional, preserving ordinary map availability. SDK 57 manifest mods execute in reverse registration order, so the normalizer is listed before Viro. Existing Maps/Camera/Router patches, source-built Expo Camera, public Maps key injection and microphone/background-location blocks remain intact. CNG's generated `android`/`ios` package-script edits were restored; native directories remain ignored and were not hand-edited.

Profile exposes the signed-in test only with `__DEV__` and `EXPO_PUBLIC_VIRO_SPIKE=1`; its route repeats the guard, and Start is explicit. Native Viro evaluation occurs only after capability/permission checks, measured bounds and stack-transition readiness. No GPS watcher, paid Places/Routes call, destination fact or admission token is added by the spike. One square is captured ahead at first NORMAL/horizontal pose, stays fixed in its native frame, reacts to taps, dims during tracking loss and retains its pose/tap state on same-frame recovery. It is not the M2 translation-following ring. M1 requires explicit Retry after every background/blur; production location admission and live-session restoration remain later work.

Focused red/green regressions cover configuration, raw support enums/missing native integration, shared actual camera-request activity, passive permission reads, deadline/late callbacks, measured scene/installed SDK focus/transition gates, same-frame tracking recovery, release/dead-route guards and actual EN/KO/JA permission/fallback/recovery/language-change UI. Independent read-only review found two Important permission bugs: a delayed read could prompt after blur, and a hung passive read could disable Retry indefinitely. New regressions reproduced both, then passed after ownership revalidation immediately before prompting and separate retirement of passive reads. Existing prompt deduplication remains covered. A Minor queued old tracking-status callback issue is explicitly deferred: it can briefly change guidance during Retry but cannot grant readiness/admission or move the square; fence it before production M3.

Checks performed on the final application code:

- `npm run check`: **passed**, strict TypeScript, zero-warning ESLint and **720 tests / 65 files**. The isolated unchanged baseline passed 682 tests / 61 files. An intermediate import-order lint warning was corrected before the final full check.
- `npm test -- src/features/destination-ar`: **37 tests / 4 files passed** after the review fixes.
- `npx expo install --check`: **passed**, dependencies up to date.
- `npx --yes expo-doctor`: **21/21 passed**.
- `npm run check:native-patches`: **passed**, zero files updated.
- `npm run check:android`: **passed**, including new AR-optional metadata/features assertions and existing permissions/Maps/EAS profile assertions.
- `npx expo prebuild --platform android --no-install`: **passed** in the isolated worktree. Generated Kotlin/Gradle declarations include AR-only package registration and existing Fabric/Hermes configuration.
- `npm run export:android -- --max-workers 2`: **passed**, Metro/Hermes Android export, **8 MB**, repeated after the permission fixes. This is not an APK.
- `git diff --check` and staged whitespace verification: **passed**.
- Local `./gradlew :app:processDebugMainManifest --no-daemon --console=plain`: **blocked/failed** at project configuration because `ANDROID_HOME` points to nonexistent `/home/kirbysmashyeet/Android/Sdk`. Gradle plugin compilation ran, but no final merged manifest, app-native compilation or APK was produced. Validate merged manifest/permissions and native compilation in the specifically authorized EAS development build; do not claim this task passed.

No Edge code or limiter migration changed; no live provider, APK/device, ARCore installation, native tracking/touch/font/preview/performance or ACLC field GPS test was performed. The existing Galaxy A53 is only a candidate device; previous Expo Camera evidence is not Viro evidence. Its current charge/AR services and the intermittent baseline Fabric issue still need the controlled physical check. Use the [ACLC native checklist](aclc-ar-device-testing.md); request approval for the specific `development` APK before building. All physical scenarios are currently NOT RUN.

### ACLC M1 approved native development build — 2026-10-25

The owner explicitly approved one EAS Android development APK after preparation and deferred ADB testing because the phone is unavailable. CI [40172052234](https://github.com/mjfelecio/ARgala/actions/runs/40172052234) passed on the approved `fa29e8e76f20750582e5fcea04e96840640eea20`. EAS CLI 25.3.0 submitted exactly one build using the existing `development` environment/profile and remote keystore with `--freeze-credentials`. [Build 91f33401-365b-4ec0-b0c2-23c1f0c4ec25](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/91f33401-365b-4ec0-b0c2-23c1f0c4ec25) finished successfully at `2026-10-25T07:43:18.768Z` (15:43 Asia/Manila); Gradle logged **BUILD SUCCESSFUL in 17m 30s**, including manifest processing, native compilation and `assembleDebug`. No app code, native configuration, signing credentials or dependencies changed for this build.

[Development APK](https://expo.dev/artifacts/eas/xCwGwSwy5ztzenU8RU19Z06JjtsDUhrH3bOPLc8VdUw.apk), 308,575,060 bytes, SHA-256 `0b756a3f883042a70c70d44d28d44fffad4a726828867e881a1d0a5daa5dff95`. The CLI-authenticated artifact download succeeded after an unauthenticated direct request returned 403. A checksum-verified local copy is retained at `/home/kirbysmashyeet/.cache/argala/builds/91f33401-365b-4ec0-b0c2-23c1f0c4ec25/argala-development.apk`. The final packaged manifest was inspected with Android AAPT2: correct package `com.mjfelecio.argala`; camera and AR-camera hardware optional; ARCore metadata optional; camera permission present; microphone/background-location permissions absent; native Maps key metadata present without recording its value. The APK contains arm64 Viro renderer/ARCore libraries and the Viro package/module DEX classes. This closes the cloud native compilation and final-artifact configuration checks that were unavailable locally because the Android SDK directory is missing. It does **not** establish runtime ARCore support/initialization, tracking, camera aspect ratio, native glyphs, taps, performance or live providers.

Fresh `npm run lint` and `npm run typecheck` passed during the build. No tests beyond the already-green source/CI baseline were needed for this build-only task. No ADB command, installation, emulator/simulator session or physical/on-site test was performed. The phone remains unavailable per the owner; [physical Gate A](aclc-ar-device-testing.md) remains pending and all physical scenario results stay NOT RUN. No downstream M2 work or additional APK build was started.

### ACLC M1 physical startup and touch correction — 2026-10-25

The owner made the Samsung Galaxy A53 / SM-A536E (Android 16/API 36, font scale 1.1) available for ADB testing. The already-installed APK exactly matched approved build `91f33401-365b-4ec0-b0c2-23c1f0c4ec25`, SHA-256 `0b756a3f883042a70c70d44d28d44fffad4a726828867e881a1d0a5daa5dff95`; it was not reinstalled. Existing authentication/preferences were retained, and the real Google map and Profile/Settings opened. Google Play Services for AR was already installed at 1.44.241490493; no install/update prompt occurred. The test used the isolated worktree's opt-in JS through Metro/ADB reverse, not a second APK build.

Native tracking reached NORMAL with a valid first horizontal pose (“Tracking ready”), and the owner confirmed a live camera and square on the phone. An initial ADB capture appeared black behind the utility controls; the owner's physical observation established that the camera/square were visible. The owner then reported that tapping did not respond. With only the React Native utility overlay temporarily removed after readiness, the unchanged Viro square click handlers produced “Tap received.” After restoring the controls with a content-height top overlay instead of the previous full-screen safe-area bounds, the owner confirmed one successful interaction with controls visible. Top/side safe-area protection and the full measured native scene remain intact. The diagnostic removal was reverted; there are no frame/coordinate logs or camera screenshots in Git.

This was an isolated touch-path improvement; reliable interaction was not established, and the later hold-versus-short-tap distinction prevents attributing repeatability to this overlay change alone. Existing mocked native-renderer tests cannot reproduce Fabric hit routing, so no class-name assertion or direct callback invocation is presented as proof of this fix. A focused independent read-only review found no material issue in the layout correction and noted that existing non-scrollable preflight overflow at extreme fonts/short screens remains unverified.

Home/background disconnected the camera. Returning displayed the interrupted state with explicit Retry and did not automatically mount another native scene. A later startup without a usable tracked pose reached the localized 20 s timeout and released the camera. This was not classified as unsupported hardware. A development-client Reload briefly attempted to load a missing embedded script; reopening the same approved client through its Metro URL recovered without data/permission resets or a new build. Discovery remained unsearched; no Places/Routes action was initiated by the spike.

Fresh checks after the JS correction: `npm test -- src/features/destination-ar` **37/4 passed**; `npm run check` **passed**, including strict TypeScript, zero-warning ESLint and **720 tests / 65 files**. No dependency, native configuration, Edge code or build artifact changed, so those previously successful checks were not repeated for this layout-only correction.

The owner subsequently confirmed **stays in place with parallax** after yaw and sideways movement, then **tracking lost, then same square and tap state** after covering the rear camera, turning the phone and recovering. These brief physical checks pass for the world-fixed square and retained orientation/tap state. They do not establish extended walking/performance. Battery began at 25%; the last reading before the permission checks was 19% / 38.9°C.

ADB briefly disconnected before the first Exit/revocation commands; those commands did not execute. The connection returned, Profile and camera disconnect were observed, and restoring ADB reverse recovered the development-client Metro connection. With the camera revoked through ADB while backgrounded, Start showed contextual Allow guidance without an OS prompt or camera mount. Explicit Allow opened the real Android permission dialog. Choosing Don't allow produced interrupted/Retry; another Home/resume did not prompt or mount the camera. The resulting USER_FIXED flag was cleared and the original granted camera permission/flags were verified restored exactly. Exit returned to Profile and Explore/map reopened with no camera connection. Final Home leaves the app backgrounded; original stay-awake setting remains `0`. Final battery was 17% / 39.5°C, so no extended tests ran.

**Physical Gate A is still pending:** missing/outdated AR-services installation/decline and the denied-settings UI were not exercised; post-restoration tracking was not rerun. Native font identity/CJK, large-font/outdoor readability, remaining preview/theme checks and live POI Details/Directions are not established by this session. No ACLC on-site GPS or production admission was tested; no M2 code was started. See the [scenario record](aclc-ar-device-testing.md).

Follow-up correction: after the isolated successful tap, the owner reported taps were still very unreliable across text/panel/border. The bounded-overlay change does not establish reliable interaction. Repeated native input delivery was investigated further below; short taps remain an accepted temporary platform limitation.

### Owner-approved temporary held interaction — 2026-10-25

The owner clarified that reliable alternation required longer holds; ordinary short taps still failed. Do not interpret earlier isolated successful clicks as short-tap acceptance. The shared parent click owner fixes cancellation across the square’s text/fill/border (three focused regressions failed first, then passed), but does not fix the pinned Android recognizer. Exact packaged AAR bytecode confirms the 50 ms stationary-press gap in `ViroTouchGestureListener`; see the [device record](aclc-ar-device-testing.md#temporary-hold-interaction-decision-and-offline-follow-up).

At the owner’s explicit direction, native correction is deferred and **hold briefly, then release** is the temporary prototype instruction. EN/JA/KO live/label copy now uses held interaction guidance. Native label font size was reduced after capture confirmed the old text was clipped; this final size/readability is not device-verified. Existing typography family, geometry, provider safeguards and native runtime remain intact. Temporary event/state diagnostics and the native-correction draft were removed; no Viro binary, Gradle export, native patch runner or dependency changed. No new build was requested or started. Further ADB work stopped when the owner needed the phone.

Final offline checks: `npm run check` passed strict TypeScript, zero-warning ESLint and **727 tests / 65 files**; focused destination-AR checks passed **44 tests / 4 files**; `npm run check:native-patches` passed with **0 files updated**; `git diff --check` passed. Independent read-only review found no material code/test issue; evidence wording was corrected to avoid attributing short-tap reliability to isolated interactions. Physical Gate A remains pending, including final held-interaction copy/size, AR-services cases and outstanding presentation checks. M2 and ACLC GPS integration were not started.

### Resumed device verification and development loading failure — 2026-10-25

The owner made ADB available for final hold-guidance/text-size verification of `3b764ef` on the existing Galaxy A53 development APK (7% battery, USB charging). Start initially showed the development render error `Could not load bundle` for the lazy AR module. The app process remained alive and the Android crash buffer was empty; the ADB Metro reverse mapping had disappeared. Restoring forwarding and preloading the exact module cleared that loading error without app/native code changes or a new build.

The next attempt connected the camera at 18:37:19 and released it at 18:37:37 when the first tracked horizontal pose was not reached before the startup deadline. The localized timeout/Retry UI was observed. A synchronized owner-held upright Retry was requested; while awaiting it, the camera was off. Final readability and held-interaction acceptance remain pending. This is not a passed startup/interaction check or proof of an Android renderer crash. Original camera grant/flags remained unchanged.

Fresh typecheck and zero-warning lint passed. The application source is unchanged from the previously validated 727-test commit, so no full-suite rerun was required for this evidence-only update. [Detailed scenario record](aclc-ar-device-testing.md). Gate A and M2 remain pending; no native correction, APK build or ACLC GPS verification was performed.

### Held interaction accepted with finger-pad technique — 2026-10-25

Following the synchronized upright Retry, the owner reported the updated held interaction was much more stable and **passable**, with better results using more of the finger pad. This clears the pending owner-held retry/interaction observation from the previous entry. It does not establish touch-area causation, reliable short taps or universal gesture performance. Native font identity/CJK and full-label readability were not separately scored.

The camera connected at 18:49:46 and disconnected at 18:54:06 after Home; release was verified. EN/JA/KO live guidance now briefly suggests the finger pad while retaining hold/release. Native touch handling, scene geometry and hit area are unchanged. The wording has automated locale/screen coverage; separate phone confirmation of this last copy edit remains pending. No native correction or APK build was started. The broader physical checklist remains partial; no M2 or ACLC GPS implementation was started.

Final checks for the finger-pad copy update: `npm run check` passed strict TypeScript, zero-warning lint and **727 tests / 65 files**; targeted screen/localization checks passed **13 tests**; `git diff --check` passed. No native/dependency or Edge changes required additional build/provider checks.

### M1 merged; M2 development ring prepared — 2026-10-25

The owner explicitly authorized merging PR25 and starting the next task. PR25's validation passed at288c598 (CI40186957578); it was made ready and merged with incremental history preserved as321dbc93c777f8c360ce98c2631098e7fcbf8e95. M2 uses the existing managed worktree on `feat/aclc-information-ring`; no replacement app was scaffolded and the main checkout's unrelated files were left alone. M1's passable held interaction and demonstrated native tracking are accepted as the development feasibility checkpoint; outstanding device cases are not retroactively marked passed.

Commits716e5ff/f7c9bb2/1cf0a2b add pure ring/focus geometry, grapheme-safe reading foundations and the separately guarded native ring route. The M1 square route remains. Native pose publications avoid per-frame React/root updates; initial yaw stays fixed, focus captures current view once, native controls page/reflow text, and same-frame recovery preserves basis/focus/page. A zero-origin native parent keeps moving/animated coordinates consistent with the pinned bridge's internally anchored direct scene child. All mock body text is visibly development content in EN/JA/KO; no ACLC facts, coordinates or media were invented.

One pure-JS MIT dependency, unicode-segmenter0.17.3, was installed through Expo because Hermes cannot be assumed to offer Intl.Segmenter. No Viro version, native patch, permission, provider, authentication, general preference or build configuration changed. Reading size alone uses a separate local key. No new APK was built. The existing development APK is being used for the separately recorded physical check.

Initial full validation passed769 tests/71files with strict TypeScript and zero-warning lint; the AR suite passed86 tests/10files, Expo install check passed and Doctor passed21/21. Android Metro/Hermes export passed at8MB. An intermediate full-suite failure was the explicit app-stack route contract needing the new guarded viro-ring entry; it was updated before the green run. These checks do not prove native tracking, animation timing, font fit or GPS.

Independent read-only review found no Critical issue and two confirmed defects: Close could target an old ring location during translation, and a remount read could race pending size writes. Focused red regressions reproduced both. The fix animates Close in a ring-following frame, gates the native coordinate handoff until commit, and orders reads after queued writes. Narrow review also exposed unchanged declarative zero coordinates failing to reset imperatively translated parents. Explicit layout-commit resets now cover both panel and ring origins. Six added regressions were observed failing before their corresponding fixes; targeted scene/controller/store checks passed26 tests. Fix commit9968e70 preserves these changes. Final `npm run check` passed **775 tests / 71 files**, strict TypeScript and zero-warning lint. The final Android export passed after the origin-reset fix; `git diff --check` passed. No APK compilation or GPS verification is implied.

Physical Gate B is incomplete. ADB and a private capture on the existing Galaxy A53 APK confirmed a live camera and Overview tile at20:38; the phone was13%, USB charging. This is rendering evidence only. The owner confirmed Overview ahead and History right. Home released the camera (empty active-client list), and return showed explicit interrupted/Retry UI. Focus/readability, full rotation/translation and same-frame ring recovery remain pending. All native fit/handedness/CJK/transition/performance checks remain in the [M2 checklist](aclc-ar-ring-device-testing.md); the prior M1 held-square result is not ring proof. Native correction remains deferred, and no M3 production session/admission, map/proximity integration or on-site GPS claim is made.

### M2 first device findings and presentation correction — 2026-10-25

The owner confirmed Overview ahead and History to the right, then reported focus works but text is blurry/small and controls, especially Close, are difficult. The owner explicitly corrected an initial answer: the problems were text and interaction, **not clipping/off-screen content**. Focused world stability, full translation/rotation and reading acceptance are not passed. Home released the camera and return required explicit Retry.

The pinned bridge passes fontSize to native bitmap text generation; the original3–8 point sizes match Viro's documented low-resolution blur risk. A shared M2-only text adapter now rasterizes8× font/layout dimensions with reciprocal scale, preserving world-space bounds, typography and pagination. Visible native controls are taller, labels larger and rows separated; Close is wider. This is a presentation/affordance correction, not a native recognizer change or proof of reliable short taps. It does not change the approved hold/release limitation. The low-battery phone was backgrounded during offline work; an explicit brief retry was offered on the existing APK.

Two regressions first failed on the low-resolution texture and undersized action surface; after the correction the real-scene suite passed19 tests. Final `npm run check` passed **777 tests / 71 files**, strict TypeScript and zero-warning lint; Android export passed. No new native/configuration/dependency change or APK build. Physical sharpness/interaction acceptance of this correction remains pending.

### M2 control-column and text-rectangle correction — 2026-10-25

The owner confirmed the higher-resolution text is readable, then reported an opaque-looking rectangle behind text at some angles and complete failure of one control column, with the working side changing by selected panel. Pinned Viro hit-test source showed the decorative panel geometry still competing through axis-aligned bounding boxes, even without handlers. An analytical ray/AABB reproduction with the actual panel dimensions confirmed background-before-button hits at oblique headings; it is mechanism evidence, not a replay of the owner's pose.

Fix0f683f0 explicitly removes decorative/disabled geometry from input, uses accurate triangle hits on enabled visible tile/button fills and retains one existing parent click owner. Explicit background/fill-before-glyph orders address transparent text quads writing depth before their backplates. Native recognizer timing, visible control dimensions and the approved held interaction are unchanged in this fix. No new dependency, configuration, native patch or APK build.

Five new regression cases failed before the relevant fixes, then passed. Scene fixtures now clone actual locale resources so the intentionally oversized-content case cannot contaminate later tests. Initial full validation caught a test-only TypeScript host-node comparison; after correcting its type, `npm run check` passed **782 tests / 71 files**, strict TypeScript and zero-warning lint. Android export and `git diff --check` passed.

On the same Galaxy A53/existing APK plus current Metro, the owner answered **“Both sides work; rectangles gone”** after the requested brief control sequence. This verifies the two reported symptoms in that trial. It does not pass all panel/size/locale combinations, tracking recovery, outdoor contrast or the rest of Gate B. Camera connected21:12:52, disconnected21:14:18, and its active-client list was empty after Home. Battery ended6%, USB charging/38.4°C; device work stopped. [Detailed record and remaining gates](aclc-ar-ring-device-testing.md). PR26 remains draft; M3/admission/GPS integration has not begun.

### M2 merged; M3 session lifecycle prepared offline — 2026-10-25

The owner authorized PR26 merge and proceeding. Its exact head812f8d3 passed GitHub validate40196806148; it was made ready and merged with incremental history preserved as956ecfc1fdcdf7c74116596c029c73ce2a76b007. The existing managed worktree now uses feat/aclc-ar-session. A fresh check of the merged baseline passed782 tests/71files, strict TypeScript and zero-warning lint. M2's brief owner trial passed readable text, both control columns and removal of text rectangles; its broader physical checklist remains partial.

M3 commits7b8a916/d7f2137/9a892a4/09d089a/1c29b5c add the execution plan, pure pending/established session model, foreground startup policy, logical scene restoration/reveal and guarded route integration. Session identity binds admission ID, selected destination, principal and provenance. Pending entry is revalidated after native module resolution and before native mount. Only tracking-ready establishes live restoration authority. Camera ownership ends on blur/background/Exit; brief live-session return restores logical panel/page from a fresh frame after passive grant checks. Interrupted initial or recovery startup requires explicit Retry; expiry is exactly300000ms and clock rollback fails closed. The original square, map/provider/auth boundaries and existing preferences remain.

The real reading controller stays above disposable native rendering, preserving unsaved size and save errors across native remount. Same-frame tracking recovery keeps ring/focus orientation; remount uses no old transforms. A first-use approximately2.4s reveal starts after ready, pauses on lost tracking, supports Skip and respects reduced motion. Only a dedicated introduction completion flag is added to device persistence; no admission, location, pose, provider data or camera frames are stored.

Regression evidence includes initial missing modules, denied final gate, expired ready, fresh-frame logical restoration, reveal timing, intro errors and queue ordering; focused failing cases were observed before their fixes. Additional final audits reproduced callback-only rerenders invoking interruption twice and a missing admission-ID identity guard; both were fixed with regressions. A test-only old ReactTestInstance lookup after unmount was corrected to capture the callback beforehand. Test fixtures use installed Router focus hooks/transition readiness, actual EN/JA/KO resources, real session/hooks/screens and mocked native/auth boundaries. They do not establish real camera tracking, permission activities or GPS accuracy.

Final local `npm run check` passed **849 tests / 75 files**, strict TypeScript and zero-warning lint. Targeted startup/real-screen verification passed37 tests; the final identity/model/hook/screen run passed51. `npm run export:android` passed:2848 modules,8.1MB Android Hermes bundle. `git diff --check` passed. No native dependency/configuration/SDK or Edge change required a new APK/provider/limiter run. These are automated/JavaScript results, not native compilation or physical verification.

The owner explicitly stopped ADB verification and deferred hardware work to2026-10-26. No M3 device verification was run. The camera was already released in the M2 trial and the task Metro server was stopped; no subsequent device commands were used for M3. The [M3 physical checklist](aclc-ar-session-device-testing.md) records all M3 rows NOT RUN. In pinned Viro, renderer startup failures are logged without a JS callback and supported install states are collapsed; interrupted startup offers Retry and silent native failure falls back to the bounded localized timeout. Precise install/update/decline classification remains an integration limitation, not an invented SDK event or passed device case. Native gesture correction and new APK builds remain outside this change.

M4 owns real selected-destination entry/GPS integration and approved ACLC activation coordinates/content/provider association. Missing inputs do not block this labeled development candidate. No production geographic admission, outside-radius field trial, on-site GPS accuracy or complete Gate B acceptance is claimed. Independent review and draft PR follow this prepared checkpoint.

### M3 independent review fixes and final offline candidate — 2026-10-25

Independent read-only review of956ecfc..d8a8bb2 found no Critical or Minor findings and two Important issues: a partial wall-clock rollback could extend restoration, and LIMITED/UNAVAILABLE offered no explicit tracking Retry. The reviewer reproduced both against the actual model, ran61 focused tests across four files and made no mutations/device calls. The M4/physical/native-classification limits were appropriately outside its verdict.

One fix pass,160fd59, adds an independent in-process elapsed deadline alongside wall time, reschedules early expiry callbacks and prevents stale suspension timers from closing a recovered live frame. Explicit localized Retry tracking now retires the limited frame, retains reading progress and established admission, and acquires a new pose. It does not restart merely on tracking loss; interrupted recovery retains the original grace and still requires explicit Retry. Six focused regressions were observed failing before fixes; additional actual EN/JA/KO recovery-UI coverage passed.

Final local `npm run check` passed **857 tests / 75 files**, strict TypeScript and zero-warning lint. The corrected model/hook/screen run passed57 cases before the two additional locale cases entered the final suite. Post-fix `npm run export:android` passed2848 modules and an8.1MB Hermes bundle (`entry-29f614392076f72126a6383cc046f07c.hbc`). `git diff --check` passed. The final fix pass is covered by implementer-run regressions/full checks; no second independent review is claimed.

M3 is **prepared, awaiting physical verification**. At the owner's explicit request, all ADB/device work remains stopped until verification is resumed tomorrow; Metro is off and no M3 APK was built. All [M3 device scenarios](aclc-ar-session-device-testing.md) remain NOT RUN. No M4 production admission/GPS/content integration has begun; precise native startup-failure classification retains the documented pinned-SDK timeout/Retry limitation.

## 2026-10-27 — M4 arrival foundation and M5 map preparation

Owner reports the ACLC ring prototype works well. This is not a blanket lifecycle/GPS pass. No ADB commands, native build, installation, camera capture, on-site GPS test or paid provider request ran in this stage.

- Approval-aware pilot metadata preserves D01–D09. Owner supplied an approximate entrance and explicitly selected the Maps place point as the activation center; see `docs/aclc-pilot-inputs.md`. Radius remains a 50m trial.
- Foreground arrival consumes exact continuous-watcher position/accuracy/timestamp independently of later one-shot fixes. Three distinct readings over six seconds, conservative containment, freshness/quality/jump guards, expiry, invitation dismissal, and corroborated exit are deterministic hypotheses awaiting field calibration.
- Thirty-second single-use entry handles bind selection/principal and revalidate pending first mount. These are prepared interfaces; the real destination scene is not wired yet and no current production Launch action is exposed.
- Independent read-only review of `06f972b..cd4b7e8` found one Important retained-callback ownership bug. Root reproduced a failing actual-hook regression and fixed it in `ff8850c`. No second independent review of that fix is claimed.
- ACLC card now opens the retained existing map/minimal sheet, including without GPS. Delayed map readiness preserves the requested center. Directions uses the separate approved entrance and explicit featured context; its existing GPS owner feeds arrival without another watcher. Provider matching is exact approved-ID only; none is yet approved for ACLC. Legacy generic AR route is dormant and mounts no camera or GPS; implementation is preserved.
- Rich featured copy is withheld from prearrival 2D details. Ordinary provider details remain unchanged. Arrival UI/locales are prepared; approved factual content remains absent. Research draft preparation is separately authorized, not content approval.
- Final checks at this source state: `npm run check` passed **902 tests /81 files**, strict TypeScript and zero-warning lint; `git diff --check` passed. M4 Android export passed before the M5 map changes; a final M5 export remains pending. Earlier intermediate RED runs are superseded by the final successful run.
- M5 remaining: selected-destination native entry/preflight handoff, restoration/Exit integration and release guard tests. M6 text/category/area search, driving preview/Maps handoff and M7 simulation/field gates remain outstanding. Do not report the complete vertical slice delivered.

## 2026-10-27 — M6 search/routes candidate and review fixes

- Added authenticated `places-search` and `route-preview` handlers. Shared auth, complete body/schema limits, atomic quota consumption, provider timeout/error mapping and explicit field masks remain in front of Google. The installed `walking-route` contract remains available.
- Free text, five bounded categories and viewport-derived Search This Area are explicit actions. Text Search uses supported type filtering/location bias with returned-circle containment; empty text uses typed Nearby. Area radius caps at5000m/20 results. With no GPS/known center, an explicit global text search supplies no invented center. Search results retain source response age for complete Details reuse.
- Mode selection is a draft until explicit Preview. Snapshots/cache reuse distinguish walking/driving; displayed mode/target drive Google Maps URLs with no origin. Existing local walking progress remains a separate walking-only action. Universal HTTPS linking provides Maps/browser handling; rejected linking leaves the preview and localized recovery.
- Independent immutable review `ec0ef9b..ed4fcd7` found three Important no-GPS/attribution defects. Root observed four focused failures, then fixed viewport-vs-physical proximity display, GPS-independent Directions/search retry and global-result attribution. Inspection of sibling results surfaces also required the existing Google Maps logo on this new list; its regression failed before the fix. Reviewer Minor wrong-mode loading/error copy was regraded as a material known-error contract and fixed with actual EN/KO/JA resources and `EdgeRequestError` coverage. No second independent review is claimed.
- Final `npm run check`: **931 tests /84 files**, strict TypeScript, zero-warning lint, all passing. `npm run check:edge` passed all five handlers; `npm run lint:edge` passed13 files after correcting the async wrapper's await. `git diff --check` passed. M6 Android export remains pending.
- **Not deployed or tested live:** both new Edge endpoints. No provider request, external device Maps launch, native build, APK installation, ADB action, AR tracking or real GPS verification ran. Deterministic provider/native mocks establish contracts, not live credentials, route accuracy or field arrival.
- Research draft: `docs/content/aclc-research-draft.md` contains sourced EN/JA/KO text, uncertainty, a candidate provider ID and no licensed campus image. It is unapproved and not in the production manifest.

## 2026-10-27 — selected-destination integration and deployed endpoint auth

This entry supersedes the earlier same-day prepared/unwired/not-deployed status.
The owner restored Supabase access; configured application host and linked project
matched `dhjlcvviiscuuzjtzxor`. CLI2.122.0 deployed only `places-search` and
`route-preview` using `--use-api`, both successfully. Existing endpoints, secrets,
DB schema and limiter were unchanged. Live POSTs with missing and bogus bearer
tokens returned401/`UNAUTHORIZED` on each new endpoint (four rejection checks).
No authenticated paid Google request was made; credentials/provider success,
route accuracy and Android Google Maps handoff remain unverified.

Principal-scoped admission now connects retained featured-map/Directions selection
to the actual native ring route. Source leases, single-use transfer, pending
first-mount/first-ready freshness and selection/auth invalidation are covered.
Only established tracking-ready sessions stop initial-entry GPS and receive the
bounded live recovery exemption. Approved text renders directly with per-field
locale fallback. Draft research and geographic simulation require development
runtime guards, remain labeled, and never feed synthetic coordinates into real
arrival. The ACLC draft is scoped to `pilot-aclc`; published factual content,
licensed media and exact provider association remain unapproved.

Independent read-only review of `47a6f2f..74f5696` found two Important issues:
expired logical ownership offered an unrecoverable Retry, and other destinations
could load ACLC draft text. One fix pass makes expiry terminal with Back to
Explore/new handoff and guards the draft store, UI and lazy loader by destination.
Seven focused regressions were observed failing before fixes. Older expiry tests
were updated to require a fresh logical owner instead of reviving the expired one.
No second independent review is claimed.

Final `npm run check` passed **970 tests /90 files**, strict TypeScript and
zero-warning lint. `npm run export:android` passed with an8.1MB Hermes bundle
`entry-68274ca1d5ba5b229e40d305553f3a1a.hbc`. Edge typecheck passed all five handlers;
Edge lint passed13 files; `git diff --check` passed. No dependencies,
native configuration or recognizer changed. No ADB, APK build/install, Metro
startup, physical AR/GPS test, on-site calibration or device Maps launch ran.
Automated native/network mocks and an export do not establish those outcomes.

The owner reports the existing ring prototype works well. The integrated selected
flow and full M3 lifecycle still require the separate
[selected-flow checklist](aclc-selected-flow-device-testing.md); simulation is not
on-site arrival evidence. Later Passport/guest sync/reminder/offline/fallback phases
remain deferred. Current changes stack on unmerged draft M3 PR27.

## 2026-10-27 — integrated ACLC off-site device trial

Owner explicitly resumed ADB testing. Source `c09ce99`, Galaxy A53 SM-A536E,
Android16/API36; existing installed version1.0.0/code1 APK SHA256
`0b756a3f883042a70c70d44d28d44fffad4a726828867e881a1d0a5daa5dff95`.
No APK build, native correction or recognizer patch. Battery36%, USB charging,
36.5°C at start. Metro ran with the development opt-in over USB reverse8081.
The first request preceded server readiness; USB transport later reconnected and
the development runtime remained blank. Re-establishing reverse and restarting
only this app loaded the current bundle; no application-code change was made.

Observed the existing signed-in map render, Featured Destinations including
preserved D01–D09 plus pilot-aclc, ACLC selection on the retained map, and the
explicit Simulate arrival action. The actual selected route displayed ACLC identity,
simulated-arrival disclaimer, live camera and Overview tile. Owner answered
“Ring opens and text is readable” after opening a tile with the accepted held
finger-pad technique. This is a partial integrated off-site ring/content pass,
not on-site geographic admission or complete locale/control coverage.

PR28's GitHub validate check passed in2m33s (run40488161834). That automated result
is separate from device observations. Authenticated paid-provider calls, Google
Maps launch, actual arrival accuracy/calibration, all locale/size combinations and
expired-session return remain unverified in this trial.

Background/return: first attempt was inconclusive (owner had closed the panel).
Repeated with expanded page3/3: Android reported `Active Camera Clients: []` after
two seconds in the background, then the owner confirmed “Expanded panel restored
on page3/3” after return. This verifies that brief recovery case on the recorded
APK/device; five-minute expiration and permission/install interruptions remain
pending.

Owner also confirmed same native-scene tracking loss → turn → recovery retains
original orientation and expanded page3/3. Exit returned to the retained selected
ACLC map, and Android reported no active camera clients afterward. Battery ended
35%, USB charging,37.0°C. These observations pass those brief scenarios only;
full field/lifecycle/locale acceptance remains pending.

Documentation-only evidence update: `npm run typecheck` and `npm run lint` passed;
`git diff --check` passed. No application code changed and no additional full
suite/export was necessary; the previously recorded970-test/Android-export and
PR28 CI results refer to the implementation candidate tested here.

## 2026-10-28 — merged ACLC slice; local guest travel journal

Owner authorized merging and continuing while ADB is unavailable. Fresh pre-merge
`npm run check` passed970 tests/90 files, typecheck and zero-warning lint. M3 PR27
merged as `d01ab9a154a4554d2559e8ab02f725cb94dd5979`, then PR28 was retargeted
to main and merged as `de429f3c80aa451d555875a6f18568d24bf9f00a`, preserving
incremental history. Existing GitHub validate checks were green for both. The
older installed gh CLI lacked match-head-commit and its edit path hit deprecated
Projects GraphQL; REST merge requests used the exact verified head SHAs instead.
No application rewrite, provider change or native build was needed.

New isolated branch `feat/travel-journal` adds an explicit durable guest mode,
ID-only Saved Places in existing map/details/Profile flows, and Tourist Passport
inside Featured Destinations. Guest mode is not a Supabase session: existing Edge
auth remains required for online discovery/routes. Curated/local browsing and
local GPS/AR authority remain separate. Account keys isolate progress; serialized
writes publish only after persistence; guest progress merges durably on sign-in.
Cloud sync is not implemented or claimed. Current UI states this limitation.

Passport is awarded only from an approved verified non-simulated entry's captured
tracking-ready event. Preflight, research drafts and development simulations do
not earn stamps. Retries replay an earned event rather than creating one. The
ACLC pilot is separate from the preserved nine-destination count. Bookmarks store
only exact Google Place IDs or independent curated IDs, never provider display
content/coordinates/media. Saved Google entry opens existing Details with explicit
recovery instead of automatic provider calls.

Independent read-only review of `de429f3..013864d` found two Important issues,
no Critical/Minor: stale pre-claim account migration and Passport retry exposed by
an unrelated bookmark failure before tracking-ready. Actual repository/provider
and retry regressions reproduced those failures, then passed in one fix pass
`5aebe0b`. No second independent review is claimed.

Explicit migration ownership rule: check the current owner after reads, immediately
before the first account write. Once claimed while current, the serialized
transfer finishes for that account even after sign-out; later accounts do not
inherit already-claimed guest data. Retirement before claim leaves the source for
the current account. Delayed account-write and guest-clear tests pin that rule;
no claim is made that AsyncStorage supports cancellation or atomic multi-key writes.
A failed account write retains the guest source, and failed clearing retries
idempotently. No account state becomes another account's visible journal.

Final `npm run check` passed **1006 tests /94 files**, strict TypeScript and
zero-warning lint. Final `npm run export:android` passed with8.1MB Hermes bundle
`entry-454803bc85ce94b83e3a9615fdf7fe65.hbc`; `git diff --check` passed. Focused
post-review repository/provider/selected-route tests passed34 cases. Existing Auth
UI tests now mock the native Router boundary; installed Router guards/reducers
and commit-before-navigation guest behavior have independent coverage. Initial
harness import/expected-route failures were corrected before the final full run.

No ADB, simulator, physical camera/GPS test, APK build/install, live paid provider
request, backend deployment/schema change or native dependency/configuration change
ran in this stage. Automated mocked storage/native boundaries and the JavaScript
export do not establish Android process-death storage behavior or physical layout.
The [local journal guide](local-travel-journal.md) lists the pending device checks.

Remaining approved phases: account cloud sync; trusted validated content update
publication and complete approved nine-place inputs; eligible unsupported-device
read-only fallback; per-destination opt-in background reminders; adaptive quality
and separately gated photo capture. Missing approved destinations/content/media
and real on-site GPS calibration remain genuine publication/field gates. No
research draft, guessed provider association or simulation was promoted to approval.

## 2026-10-28 — account journal cloud sync

Builds on open local-journal draft PR29 without merging it. Branch feat/journal-sync
keeps existing v1 public journals/storage keys and adds a validated v2 account
envelope: durable request identity/sequence, cloud revision and latest versioned
bookmark intents. Guest state stays local and retains its first-account claim
rule. New account requests use a captured bearer, not the SDK client's later
session; retiring a foreground owner fences network acknowledgement/publication.
Local saves remain available through network failures. Saved Places/Passport show
localized pending/syncing/synced/recovery states in EN/JA/KO. No Google display
content, coordinates, credentials, camera data or operation/location history is
stored by this feature. Passport remains application progress, not attested GPS.

Lost-response replay preserves a later remote deletion; remove→re-add during a
flight and overlapping guest saves remain explicit new intent. Conflicts preserve
unrelated remote changes and apply pending local intent without device-clock
ordering. Four reconciliation rounds and a15s complete network/read deadline are
bounded. Document/request/response and journal schema budgets remain enforced.

Commits8906f05 (durable protocol/repository),92e94a0 (SQL/isolated tests/CI),570f71f
(transport/controller/provider/UI) form the initial candidate. Fresh independent
read-only review of c02023f..570f71f ran the1041-test full check and SQL/module
reproductions. It found two Important issues and no Critical/Minor: temporary
add-before-remove overflow and unbounded client receipt admission before revision/
sequence validation. Root reproduced actual repository, SQL and known-error
failures, then fixed them in one pass b0f3e1b. No second independent review claimed.

Final reconciliation validates the completed keyed bookmark set once; true overflow
retains local state/flight. Receipt admission occurs only for accepted initial
namespaces, capped at128 per account under its row lock. Rejected fresh requests
allocate no receipt; a concurrent127→128 admission trial allows exactly one of
eight, and existing clients/replays work at capacity. No automatic eviction can
invalidate delayed replay safety. Capacity errors map from SQL54000 to a known
localized code and preserve local work. Tradeoff: another fresh device at capacity
needs account maintenance; existing clients are unaffected.

Final local `npm run check` passed **1045 tests /99 files**, strict TypeScript and
zero-warning lint. Post-review journal suites passed66 tests. `npm run test:journal-sync` passed real isolated PostgreSQL auth/RLS/direct-write/strict
payload/revision/replay/deletion/stamp/reset/concurrency/receipt-limit/cascade
checks; `npm run test:limiter` passed the existing32-call30-allowed/2-denied,
privilege/window test. `npm run export:android` passed8.2MB Hermes bundle
`entry-963fa52c7b39e84850f7f51e06ef9e03.hbc`; `git diff --check` passed. Initial
new test-harness TypeScript return/listener signatures and one lint style warning
were corrected before this final run. No new dependencies/native configuration.

Hosted access initially failed403 on project linking and the database login role.
Owner restored CLI database access. Configured host and explicit project ref matched
`dhjlcvviiscuuzjtzxor`; dry run listed only202610280001_journal_sync.sql. CLI2.122.0
applied exactly that additive migration with `--skip-vault`, no seeds/roles and
no historical migration repair or existing limiter/provider/secret changes.
Deployed source b0f3e1b; migration SHA256:
`97bf946c92ca09b1380c7264e79bf30adef7c45fe614e1e00a6c4d00cc5d77e4`.

Hosted metadata confirmed both RLS flags/owner read policies, denied direct
application writes, denied anonymous RPC execution, allowed authenticated
execution, public INVOKER wrapper and private DEFINER with pinned empty search
path, plus the recorded migration. Private schema probe returned406/PGRST106.
Live RPC POSTs returned401/42501 with missing bearer and401/PGRST301 with invalid
bearer. The final dry run reported upToDate=true/no pending migrations. Those are
hosted deployment/configuration/auth-rejection observations, not a successful
signed-in app sync or multi-device trial. No real app-account fixtures, paid
provider request, ADB/simulator/APK/Metro/device storage test ran.

Remaining checks: authenticated app round trip on two sessions/devices, offline
restart/response loss in the actual client, Android process-death/backup behavior,
and the previously pending AR/GPS field gates. See [cloud sync](journal-cloud-sync.md)
for reconciliation/ownership rules and deployment details. New sync work remains
independently reviewable; PR29 and this branch are not merged by this stage.

## 2026-10-28 — client-progress phone sweep

Source `3cffea9`, existing Viro development APK on Galaxy A53 SM-A536E/Android16;
no new APK/build or application-code change. Owner chose the laptop-connected
development-server presentation. Fresh `npm run check` passed lint/typecheck and
99 files/1,045 tests. Full scenario/configuration details are recorded in
[client smoke evidence](client-progress-smoke-2026-10-28.md).

Observed real signed-in map/provider details, destination-centered discovery,
walking/driving previews and external Google Maps handoff. Maps first-use terms
were not accepted; active external navigation was not verified. Signed-in and
guest bookmarks survived force-stop/relaunch. Offline saving retained the local
reference and exposed sync failure; restored networking plus explicit Retry
synchronized. Owner sign-in merged the guest bookmark and synchronized. All test
bookmarks were subsequently removed and the account returned to its initial empty
Saved Places. Restored English after Japanese/Korean UI checks and retained 500 m
generic activation preference; original Wi-Fi/mobile-data states restored.

Explicit development arrival/Start reached live native AR and active rear camera.
Brief background released the camera, return reacquired it, and Exit returned to
selected ACLC map with no camera clients. Camera permission revocation showed
permission/Settings/Retry guidance; restoring the grant while backgrounded did not
automatically remount, and explicit Retry reached live AR. Android exit records
classify that termination as PERMISSION CHANGE; the other observed terminations
were deliberate FORCE STOP trials. No crash/ANR events or crash-buffer entries
appeared in the monitored 10:56:57–11:34:01 window (about 37 minutes including
intentional restarts/background waits). A real 318.2-second background trial
showed expired-session guidance/Back to Explore with no camera remount; returning
to the map and starting a new explicit simulated session worked. Help/Recenter
and Android Back did not crash; spatial correctness remains unevaluated. Turning
master location off showed recovery guidance; restoring it and pressing Retry
recovered. Passport remained empty after simulated sessions. Original permissions
(including flags), network settings and master location state were restored.
Final battery 35%, USB charging, 36.3°C; camera clients empty and app backgrounded
from selected ACLC map, Metro left running. Owner deferred hands-on ring/readability/recovery checks
until later. On-site GPS, actual journeys and two-account/device isolation remain
unverified; simulated/draft AR must never earn a stamp.

## 2026-10-29 — approved destination text delivery

Isolated `feat/destination-content` from main 62f6e15; implementation commits
6248313/bb13f57/61a5908. Preserved the owner's prepared main presentation checkout.
Existing catalog/approval schema, admission snapshot and HOP query/focus/error
patterns were inspected. SDK57 documentation URLs returned HTTP errors; Context7
primary Expo/TanStack/Supabase sources and installed Expo streaming-fetch runtime
were consulted. No dependency/native configuration change.

Protocol 1 validates versioned, approved, complete EN/JA/KO AR text for existing
IDs. Project-scoped single-value offline storage serializes installs, rejects
rollback/conflicting revisions and persists before UI publication. Source catalog
geometry, provider associations and licensed bundle media remain authoritative.
Featured Destinations offers an explicit authenticated update check; guest cache
remains local. Background/principal/unmount retire requests; entry issuance
captures the resolved text without replacing live admission ownership. No actual
destination text/media approval was invented or promoted.

RED→GREEN observations: absent model/repository/service/provider/RPC; malformed
SQL null ID/role fields; and admission initially unable to see the resolved text.
Focused content/admission tests: 44 passed; installed-navigation/selected-entry
fixtures: 27 passed after adding the production Query provider and using the explicit
content resolver. React Compiler ref/effect/global-state lint findings and fixture
TypeScript signatures were corrected. Final `npm run check` passed typecheck,
lint and 103 files / 1,077 tests. Independent whole-branch read-only review plus a
focused lifecycle follow-up found no material defect; reviewer did not rerun tests.

`npm run test:destination-content`, `npm run test:limiter` and
`npm run test:journal-sync` all passed in isolated PostgreSQL. Each now applies
the complete migration chain. New tests cover no seed, authenticated read/anonymous
and missing-user denial, denied client publication/direct table reads, strict
manifest checks, monotonic revision/withdrawal, forced RLS and preserved existing
RPC grants. These are not hosted bearer or physical-storage observations.

Configured HTTPS host matched project dhjlcvviiscuuzjtzxor. CLI 2.122.0
`db push --dry-run --skip-vault --project-ref dhjlcvviiscuuzjtzxor` returned 403
while initializing its database login role. No migration, secret, role, seed or
hosted content was changed. Owner was asked to restore CLI database access; local
implementation/review continued. Hosted RPC deployment/download, physical cache
restart and unchanged live native pages after an update remain separate pending
checks, along with actual approved content and ACLC field calibration. No APK
build, ADB or simulator verification was performed for this change.

See [content delivery](destination-content.md) for authoring, publication and
offline/withdrawal semantics. `npm run export:android` passed with 8.2MB Hermes
bundle `entry-feb942170ede7708d699a623d05a8d21.hbc`. Export does not establish a
native build, downloaded publication or physical-device operation.

### Subsequent Supabase retry — 2026-10-29

Owner requested another attempt. Configured project remained
`dhjlcvviiscuuzjtzxor`; CLI 2.122.0 dry run succeeded and listed only
`202610290001_destination_content.sql`, no seeds/roles. The reviewed source at
bb13f57 matched the working migration SHA256:
`119304286ef84e010b1ab8863ba965e74de4b7a5b3b2868ad2d01fb62b707a21`.
Applied exactly that additive migration with `--skip-vault` and no historical
migration repair, seeds, role changes, application-secret or provider configuration changes.

Read-only hosted checks confirmed the recorded migration, table existence,
enabled/forced RLS, denied authenticated direct table SELECT/INSERT/UPDATE/DELETE,
denied anonymous RPC and allowed authenticated RPC, INVOKER public wrapper and
private DEFINER with pinned empty search paths. Existing journal authenticated
execution and service-only Google limiter grants were preserved. Published
artifact count was zero. Automated assertions matched all expected metadata.

Live missing-bearer POST returned 401/42501; invalid bearer returned 401/PGRST301;
requesting private-schema data returned 406/PGRST106. No real account JWT or device
storage was read and no content fixture was published. These are hosted
deployment/metadata/auth-rejection observations, not an authenticated app download
or physical offline/update/AR proof. Fresh typecheck and lint passed; application
source is unchanged from the prior 1,077-test/SQL/export verification. Draft PR #31's
pre-deployment CI also passed. Main/presentation checkout remains unchanged.

The final CLI dry run reported upToDate=true with no pending migrations, seeds
or custom roles. Hosted deployment is no longer blocked.

## Supporting MVP implementation — 2026-10-30

The `feat/mvp-completion` increment starts at main `d46af1f`, after content
pipeline PR31 was merged and its read-only hosted migration verified. Baseline:
**1,077 tests / 103 files passed**. See [feature behavior and acceptance gates](mvp-completion.md)
and the [completion plan](superpowers/plans/2026-10-30-mvp-completion.md).

Changes add explicit one-shot background reminders, definite-unsupported on-site
reader with the blueprint D20 Passport exception, conservative scheduling-based
AR decoration reduction, AR-photo preview/save/share, and validated approved
bundled galleries. No destination content or media was fabricated or promoted.
No backend migration or Edge-function change belongs to this increment.

The implementation used installed SDK57/Viro3.0.3 sources and documentation for
native boundary decisions. Independent review found and drove regressions for
reader authorization reuse after resume, notification-handoff retry spinning
while storage was deferred, Android API24/25 notification-channel checks, and
missing gallery English-fallback notices. The reviewer re-read all four fixes
and the integrated capture/bootstrap/configuration/handoff paths and reported no
remaining confirmed merge blocker. Native runtime boundaries remain mocked.

Native configuration checks confirm optional AR, explicit opt-in background
location capability without a foreground location service, notification support,
no audio/broad photo-read/media-location permissions, and WRITE capped at API29.
The ignored generated native directory in the implementation worktree was
preserved under `.superpowers/preserved-native/` before clean CNG introspection;
no generated Android source was hand-edited. Compatibility check reports current
dependencies, Expo Doctor reports **21/21**, and Android configuration passes.

New native modules have **not** been built or installed for this increment. No
ADB or physical verification occurred. Historical device results for the existing
AR ring do not establish screenshot/gallery/share/background-reminder behavior.
These still require the specifically approved rebuilt APK and physical scenarios
listed in the feature guide. Unsupported-reader gating is automated evidence,
not evidence from an unsupported phone. JS scheduling tests are not native FPS
or thermal measurements. Actual ACLC GPS calibration and approved nine-site
content/coordinates/media remain outstanding input/field gates.

Final local verification on the reviewed source tree:

- `npm run check`: strict TypeScript, zero-warning ESLint, **1,212 tests / 114 files passed**.
- `npx expo install --check`: dependencies up to date.
- `npx expo-doctor`: **21/21 checks passed**.
- `npm run check:android`: passed with the new opt-in and save-only manifest contracts.
- `npm run export:android`: final Android Hermes export completed (8.5 MB bundle).
- `git diff --check`: passed.

The first integrated run exposed two Node test imports without native/auth/storage
boundary mocks and the previous blanket-background-permission assertion. Those
were updated to the approved optional-native and opt-in configuration contracts;
the final full check above includes their real-screen regressions. No backend
checks were rerun locally because this patch changes no backend code; PR CI runs
the complete Edge and isolated SQL validation matrix.

### Integration and first refinement

[PR32](https://github.com/mjfelecio/ARgala/pull/32) merged as `9880195` after
[CI 40915663866](https://github.com/mjfelecio/ARgala/actions/runs/40915663866)
passed the complete workflow, including Edge validation and all three isolated
SQL suites. Main's tracked tree matched the reviewed `ec66c48` tree exactly.
`npm ci` completed in the main checkout, applying all four dependency patches;
Android configuration passed and an offline Metro smoke on port8091 reached the
development-build QR screen. That temporary server was stopped. Ignored local
environment/reference files were retained; the prior generated Android directory
was preserved under `.superpowers/preserved-native/` so future CNG uses plugins.

The owner specifically approved one development APK from `ec66c48`:
[EAS 2cd68ffa-4cf1-4754-8762-c59ed01ec044](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/2cd68ffa-4cf1-4754-8762-c59ed01ec044).
Submission reused existing remote Android credentials and configured development
provider variables. At this checkpoint it is queued, with no APK/device success
claim. Physical acceptance remains pending.

Refinement begins with passing the explicit reminder-consent locale into Android
channel naming instead of always choosing English. Actual EN/JA/KO resources and
controller-to-native forwarding regressions failed before the fix; the targeted
reminder suite passes **48 tests**. A focused independent review found no issues.
This is JavaScript-only and changes no native capability or automatic permission
behavior.
The final refinement `npm run check` passes strict TypeScript, zero-warning lint,
and **1,216 tests / 114 files**; `git diff --check` passes. No dependency/native
configuration changed, so the approved native build is still sufficient to test
this JavaScript change through Metro.

## Unattended Android smoke — 2026-10-30

Owner authorized ADB testing without touching/moving the phone or assisting with
sign-in. Device: Samsung Galaxy A53 SM-A536E, Android16; USB charging, battery19%
at start. The specifically approved development APK
[EAS2cd68ffa](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/2cd68ffa-4cf1-4754-8762-c59ed01ec044)
finished successfully from `ec66c48`. Downloaded archive309846604 bytes, SHA256
`ad5cc55cf6259bb4f93abd8ef9c0a702770aaa7a3045d850b8bc9d7de0403d0e`.
Installed with `adb install -r`, preserving data. Native version1.0.0/code1,
minSDK24/targetSDK36; installed update time2026-10-30 09:20:50 device local time.
Metro served main `2aff046`; subsequent JavaScript-only navigation fix uses this
same APK and adds no native capabilities. No second build was started.

Observed before the navigation correction:

- Cold launch completed; existing signed-in session survived install, the Google
  map and native location marker rendered, and no new fatal/JS exception appeared
  in the scoped test log. This is a smoke observation, not crash-free certification.
- Saved Places began empty. Explicitly saved ACLC, saw it listed with account
  sync status, force-stopped/reopened the app and found the bookmark still present
  with “Synced with your account.” This is a same-device/account UI round trip,
  not a multi-device conflict/replay or guest-merge test.
- Featured Destinations rendered Passport0/9. The explicit content-update check
  returned “No published update is available”; nothing was published or seeded.
- Real arrival stayed locked while waiting for fresh accurate continuous GPS;
  remote map selection did not unlock it. No mock GPS was injected.
- Reminder setup displayed the Android notification permission prompt. Later
  inspection confirmed notification/background grants and the app's requested
  state. Foreground return retained the selection without another prompt, and
  explicit Turn off restored the unselected state. No actual OS geofence Enter,
  background alert delivery or monitoring reliability is claimed.
- Development simulated arrival opened the real native preflight. Native AR
  acquired rear camera0; its stationary view was almost black and never supplied
  tracking-ready. Home released the camera (empty active-client list). Return
  showed explicit interrupted/Retry guidance with no automatic camera restart.
  Simulated entry is not proof of on-site arrival or an earned visit.

The normal Featured Destinations→map flow lacked View Details for featured
selections; reminder controls were reachable only through Saved Places→Open place.
The JavaScript correction restores the existing View Details action to the minimal
curated screen, carries the exact destination ID, guards focus/foreground and
returns before Google handoff/cache work. Ordinary Google Details behavior stays
covered. Actual-screen RED regressions reproduced the omission;55 map tests and
independent review pass. Full `npm run check`: strict TypeScript, zero-warning
lint and **1,220 tests /114 files**. Native maps/router/network boundaries remain
mocked in those automated regressions; physical recheck is recorded separately.

### Completion of unattended smoke and requested refinements

Live authenticated area search returned20 ordinary Google places. Ordinary-place
Details opened; explicit text search handled an empty device-centered result,
then explicit Search this area returned the requested place in the viewed area.
Walking and driving previews each displayed a real provider route/polyline.
Start Navigation opened Google Maps' first-use navigation notice. The notice was
not accepted; the test returned to ARgala. This establishes handoff, not navigation
on the road or route/accessibility accuracy.

Japanese and Korean Settings rendered and saved on the phone; English and the
existing500m device-local preference were restored. A test bookmark deletion while
Wi-Fi was off (mobile data already off; Android reported no default network)
remained available as a safe local edit with a localized sync failure. After a
process restart and Wi-Fi restoration, the deletion remained; explicit Retry sync
returned to Synced with an empty journal, matching the initial bookmark state.
The offline cold-launch UI did not finish before network restoration, so this is
not a separate offline cold-shell pass or a multi-device/guest merge result.

Reminder opt-in was turned off; original notification/background-location grants
were restored to false using ADB, and reopening did not initiate a permission
prompt. Fine/coarse location and camera grants, sign-in and existing data were
preserved. Wi-Fi1/mobile-data0 and original font scale1.1 were restored. No mock
GPS, factual publication, fabricated media, new login or additional APK build was
used. Scoped AndroidRuntime/libc and ReactNativeJS monitoring observed no unexpected
fatal or JS exception during the exercised flows; intentional force-stops and
permission-revocation process retirement are not crash evidence.

PR34 merged as426f941 after complete CI success. Its new direct Featured→map→
View Details path was then observed on the phone, reaching ACLC's minimal details
and reminder action without a Saved Places detour. Automated regressions cover retained map selection and
expanded sheet on return. The owner's subsequent panel, Directions
peek and Explore header requests are described in
[the refinement guide](ui-refinements-2026-10-30.md).

Refinement preview used the same installed APK and Metro on8082 from the isolated
worktree. Complete Directions primary actions were visible above system gestures
at font scales1.1 and1.3, including the optional mode-preview action. Original font
scale was restored. Compact Explore header and ordinary/featured map rendering
were observed. Native AR acquired/released the camera and offered interrupted
startup recovery, but the dark stationary view did not reach tracking-ready;
new panel comfort/other-tile native delivery and photo capture/save/share remain
unverified. Initial-startup retry completion/timeout was not established by this
run. Supported-phone tests cannot establish the unsupported-device reader.

Final source verification: `npm run check` passes strict TypeScript, zero-warning
lint and **1,254 tests /114 files**. Targeted RED→GREEN and independent reviews
covered current-interactivity and native-layout mount ownership, the shared
1.5-unit focus geometry, complete measured dock controls, and explicit compact
header search behavior. A first full typecheck caught a removed handleHeight prop
and a synthetic test tag typing error; both were corrected through the supported
installed handleStyle API/test boundary before the final successful check.
`git diff --check` passes. No backend/native configuration changed; CI repeats
Edge, Android export/config and isolated SQL checks before integration.
