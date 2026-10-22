# Performance and sensor audit — 2026-10-22

Status: implementation and automated verification passed; optimized APK/device acceptance pending. This is an optimization of the existing architecture. No provider cache policy, GPS filter, tracking threshold, native dependency, or background tracking was added.

## Baseline and conditions

- Started on `refine/ui-hierarchy` at `d253315`, with only the owner's untracked kickoff archives/document present. GitHub confirmed [PR #20](https://github.com/mjfelecio/ARgala/pull/20) merged at 14:45:17 UTC. Work uses dedicated branch `perf/sensor-responsiveness` from merged `origin/main`, `e04d8eb`.
- Physical Samsung Galaxy A53 (`SM_A536E`), Android 16 / API 36, package `com.mjfelecio.argala`, version 1.0.0 / code 1. Installed APK at baseline: October 21 development build, [aa63d13d](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/aa63d13d-0095-4ade-9c67-76169b1c0501). Current SDK 57 JavaScript ran through local Metro over ADB reverse.
- Battery saver was enabled. Battery fell from 10% to 3% despite USB charging, and reported battery temperature rose from about 39°C to 44°C. AR was backgrounded, then force-stopped to release resources. These conditions invalidate a representative release-performance comparison.
- Metro's first bundle took approximately 106 seconds on the host. That is development tooling overhead, excluded from application startup/transition latency. Dev-launcher `am start` timings are also excluded from meaningful-content timing.
- Baseline `npm run check`: TypeScript, lint, 616 tests / 57 files passed.

Temporary React Profiler and sensor diagnostics measured counts, duration, accuracy, sample age, displacement and angular deltas. They recorded no coordinates, tokens, provider response bodies or native error text, and were removed from production source. No analytics/telemetry system was installed.

### Observations

Three unscanned AR windows recorded **60 / 63 / 66 React commits** over **10.082 / 10.403 / 10.101 seconds**, consuming **3731 / 3041 / 3452 ms** of measured discovery-subtree rendering. These are development React timings, not a release FPS measurement.

An approximately 80-second sensor sample contained 15 GPS watcher samples and 328 heading events. Reported GPS accuracy ranged from **3–82 m**; median displacement between recorded GPS samples was about **1.98 m**. Heading calibration was **3** throughout, with a median absolute consecutive change of about **2.32°**. This establishes visible-noise potential, not ground-truth GPS or compass error. The stationary observation did not include a surveyed position or controlled walking/rotation.

One diagnostic Android window reported 1919 rendered window frames, 1228 deadline misses (63.99%), and frame percentiles p50/p90/p95/p99 of 18/25/30/46 ms. Process PSS was about 882 MiB with Map/Camera/development runtime retained. Different later windows included HMR/navigation and hotter/lower-power conditions; their frame/memory figures are **not** used to claim an improvement or leak. `gfxinfo` does not measure the full camera/Google renderer surface frame rate.

ADB confirmed heading sensor subscriptions during focused AR. After backgrounding, Android recorded their removal and `dumpsys media.camera` showed `Active Camera Clients: []`. Source inspection also verified late asynchronous subscription cleanup, foreground/focus gates, permission rechecks and the native heading implementation's bounded one-shot declination lookup.

## Findings and changes

| Priority | Feature / reproduction | Evidence and cause | Targeted change / risk |
|---|---|---|---|
| P1 | AR: leave camera open while heading changes | Device trace shows substantial subtree work. Regression: 10 heading events invoked native CameraView rendering 10 times because sensor state lived in its parent. | Move the sensor owner into the discovery child. Camera bounds, permission, foreground and native-stack transition gates remain in the parent. Verify actual CameraX behavior on device. |
| P1 | AR: send headings with changing receipt times | Regression: all 10 samples restarted the freshness interval and scheduled a second clock render. | Independent one-second clock; event receipt time accompanies the existing sensor state update. Native position/watcher timestamps and health still determine freshness. |
| P2 | AR: rotate without changing raw GPS | Regression: 10 headings with two POIs performed 20 geographic distance calculations and rebuilt distance ranking/list inputs. | Memoize geographic work on raw GPS/results/radius/tracking; project cached bearings separately. Row inputs and location-notice props no longer change solely because of heading. Raw movement still recomputes distance/eligibility. |
| P2 | AR: usable headings fluctuate by a few degrees | Existing labels assign each target directly to layout `left`; measured heading deltas can produce visible steps. | Translate horizontal label position on the UI thread over 80 ms. Snap lane/width/large changes, honor system reduced motion, cancel on unmount, immediately remove labels when validation/FOV removes the target. Device feel and transformed hit regions remain acceptance work. |
| P2 | Directions: receive GPS samples while preview is open | Real-hook regression: interval creation count increased from 2 to 6 for four GPS samples. | Same independent clock. Current receipt can immediately revoke waiting presentation/request authority; the periodic deadline retires its native owner. Existing request-time lease/freshness checks remain authoritative. |

No confirmed P0, duplicate paid-request defect, map-recentering defect or settings performance bottleneck was established in this pass. Memory retention requires a controlled release-like navigation soak before classifying it as a leak. No accuracy thresholds were relaxed.

### Deterministic before/after evidence

| Same input trace | Before | After |
|---|---:|---:|
| Native camera-boundary renders for 10 heading events | 10 | 0 |
| AR freshness interval restarts for 10 heading events | 10 | 0 |
| Distance calculations for 10 headings / two unchanged POIs | 20 | 0; raw GPS movement recomputes |
| Directions interval creation after four GPS events | 2 → 6 | unchanged |
| Small label target update | direct layout jump | UI-thread translation, 80 ms; reduced motion snaps |

These regressions exercise real screens/hooks and mock native/network boundaries. They establish reduced work and presentation configuration; they cannot establish physical-device smoothness or battery savings.

## Sensor authority and requests

There is **no GPS coordinate filtering**. Accuracy variability and lack of ground truth do not justify changing raw positions. Radius eligibility, displayed distance targets, Search origins and walking acquisition still use raw coordinates and their existing quality/freshness guards. `sampleReceivedAt` is a JS receipt clock, not a GPS fix or proof of continuous watcher health. A newer one-shot result cannot renew watcher sample age.

Circular projection already uses shortest-angle math; 359°/1° does not travel through 180°. Visual interpolation happens after raw validation/projection. Low-quality or magnetic-only direction, invalid/stale heading, bad GPS and foreground loss still clear authoritative directional presentation. Manual selection, ranking, maximum three labels and collision lanes remain intact. No Kalman filter, sensor fusion, dead zone or eligibility hysteresis was introduced.

An independent audit of QueryClient, AR/Home Places, Details reuse/selection and route intent/session code found no confirmed duplicate-call or cache-authority defect. Disabled observers, explicit Search/select/Walk actions, no global retries/refocus/reconnect fetch, original response-age bounds, authentication cache clearing and in-memory-only retention remain. Requests were not instrumented reliably on this device session, so no server-billing or device request-count guarantee is claimed. Existing and added cost/lifecycle regressions use the application QueryClient defaults.

Map style identity and retained instances, explicit recenter/Fit behavior, map-ready padding gates, sheet geometry, existing query-summary reuse and local settings drafts were inspected. No broad memoization, dependency replacement or native camera/map patch was added. Settings, all-screen transition latency, live Details/route latency and sheet FPS need a controlled device pass.

## Builds and verification

At the owner's request, a new development APK was queued from unmodified merged `e04d8eb` to include the already-approved native Location 57.0.22 update: [017af1ca](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/017af1ca-b867-42b8-8258-f3d83caaa45f). This build is the native baseline; it does not embed this branch's subsequent performance changes. A development client can load those changes through Metro. The APK downloaded from [EAS](https://expo.dev/artifacts/eas/J3RQJ_MQHyf33HHXqIZYUO2KEKS12llR0D0iQXNtF9A.apk) has SHA-256 `b8b369aa1e0dba8f857b87ee72f3cdec4cc41b04f949fd0a75f50f2ebbae9341`. `adb install --no-streaming -r` returned Success; the installed APK has the same checksum and package update time `2026-10-22 23:39:00`. The rebuilt app opened with the retained session/preferences, light native Google map and current position. This verifies installation and a functional smoke test, not the revocation fix or final sensor smoothness.

Coverage includes north wraparound, small noise, fast reversal/FOV exit, lane change/reset, deliberate raw movement across activation radius, moderate/poor accuracy, stale/future timestamps, continuous headings over stale GPS, one-shot versus watcher authority, background/resume, permission failures and single-use route intent recovery. Existing real locale/error-path suites remain part of the full check.

Final automated verification: `npm run check` passed TypeScript, zero-warning lint and **626 tests / 57 files**. Targeted AR/Directions/location passed **230 tests / 15 files**. Android configuration, native patch checks, Expo install compatibility, Expo Doctor (21/21), Android export and `git diff --check` passed. No Edge code changed. Independent review reported no important correctness issue. No temporary profiler/sensor diagnostics remain in source.

Implementation commits: `d3fa7dc` (camera boundary, clocks and geographic work); `42d1643` (UI-thread label interpolation). A controlled release-like comparison remains necessary before attributing FPS, memory or battery changes to these commits. [Draft PR #21](https://github.com/mjfelecio/ARgala/pull/21) is open and unmerged; [CI validation](https://github.com/mjfelecio/ARgala/actions/runs/39807910976) passed. The performance branch’s optimized APK is queued as [EAS preview e3adbf34](https://expo.dev/accounts/mjfelecios-team/projects/argala/builds/e3adbf34-2566-4a7d-8c63-4c4849ee06c4), from `d3b00f0` (same runtime changes).

## Remaining device acceptance

1. Charge and cool the Galaxy A53; record power saver, temperature, brightness/refresh rate, build/artifact and bundle commit. The Location-patch native baseline is installed and checksum-verified; obtain the performance branch’s optimized APK for device acceptance.
2. Repeat matching before/after traces on the same native APK and conditions. Use a release-like build of the performance branch for representative conclusions. Profile cold/warm meaningful-content startup, Map readiness, tabs, AR/Camera entry and return, Search, Details, Walk, sheet drag, Settings and foreground recovery.
3. Field-test stationary drift, slow walking, normal rotation, fast 90°/180° turns, north wrap, magnetic interference, loss/recovery, denied/revoked permissions and sensor setup failures. Check label hit targets during movement and reduced motion; preserve warnings/list fallback.
4. Observe unique paid request IDs and durations without bodies/headers/coordinates. Confirm Search/select/Walk counts and zero additional calls during focus, foreground, reconnect, language, movement and invalidation. Repeat camera/map navigation and memory/thermal/battery soak.

Documentation consulted: [Expo SDK 57 Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/), [Reanimated timing](https://docs.swmansion.com/react-native-reanimated/docs/animations/withTiming/), [animation cancellation](https://docs.swmansion.com/react-native-reanimated/docs/core/cancelAnimation/), and the owner's HOP location/sheet implementations. Existing ARgala permission, cleanup and authority safeguards were preserved when adapting those references.
