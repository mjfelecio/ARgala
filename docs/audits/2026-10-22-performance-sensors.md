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

## Device follow-up — 2026-10-23

The owner installed optimized preview `e3adbf34` and resumed testing at 32% charge. Its downloaded APK and installed `base.apk` both have SHA-256 `f8dc8bc297ee45989950b7fdb741865bf45e5fac2aac1fa923ee254cabf53164`; package flags omit `DEBUGGABLE`. Battery saver remained enabled, brightness was 137, density 420 dpi and native resolution 1080×2400. Initial battery temperature was 39.7°C and thermal status 2. The owner reported excellent responsiveness, but reported that continuously interpolated AR labels visibly jittered indoors. This is acceptance evidence against the 80 ms interpolation; the earlier tests proved its configuration, not its suitability on real readings.

A ten-second recording with the owner aiming at visible labels reproduced repeated horizontal movement of the same two badges while their vertical lanes stayed stable. The raw FOV legitimately admitted/removed a third badge near the edge. No additional GPS or FOV filtering is justified by that recording. The preview's window-frame statistics are a release baseline for these conditions, not a controlled improvement over the hotter, low-charge development session.

The first follow-up tested display-only horizontal stops approximately 32 dp apart with an up-to-8 dp boundary buffer. Stops include both safe edges, large moves snap immediately, and layout/lane changes or reacquisition reset placement. A plain `Pressable` keeps displayed and native hit geometry together. Raw projection, ranking, distances, activation, freshness and provider requests are unchanged; invalid/out-of-FOV readings still remove labels immediately. **The owner also rejected this candidate as still too jittery.** Its passing tests below did not establish acceptable device behavior.

Component regressions failed on raw 76→77 position movement before the fix. Pure placement tests cover noisy boundaries in both directions, large movement, resized/narrow bounds and reset; existing real AR traces retain wraparound, stale/future quality and paid-call checks. `npm run check` passed TypeScript, lint and **632 tests / 58 files**, and Android export passed. Independent read-only review found no important issue.

For immediate device placement validation, the checksum-verified Location 57.0.22 development client was temporarily installed with `-r`, loading the follow-up through `expo start --no-dev --minify`. This production-mode JavaScript check is distinct from optimized APK acceptance or representative release FPS. When the owner paused testing, Metro was stopped and `adb install --no-streaming -r` successfully restored the original standalone optimized preview `e3adbf34`. No snapping candidate was left installed.

### Three-position experiment — 2026-10-24

On resumption ADB found the same Galaxy A53, the standalone package without `DEBUGGABLE`, and 11% battery while USB charging at 35.7°C. Another application was foregrounded. No application install or screen interaction was performed during the offline follow-up.

The current uncommitted candidate uses three horizontal display positions (left, center, right) and holds a position until the projected target moves more than 85% of one stop interval. This replaces the rejected 32 dp grid; it adds no delay timer or sensor filter. Initial placement uses the closest stop, while geometry/lane changes and reacquisition reset it. Raw FOV exit, invalid or stale direction still removes the label immediately. This deliberately coarse presentation needs device acceptance, especially slow rotation, edge visibility and tap targets.

Two pure regressions failed against the 32 dp implementation, then passed with the three-position candidate. With bounds 8–232 dp, an initial target of 104 dp and the approximate image-derived stationary targets `[111, 115, 31, 45, 101, 82, 98, 33, 88, 70]`, the old grid changes position five times; the candidate stays at 120 dp. This is a deterministic reconstruction from approximate screenshot positions, **not** a new device measurement or proof of smoothness. Large movement to either edge remains immediate in the tests. Focused placement/component/projection suites passed 22 tests. Independent read-only review found no correctness issue. The component regressions were then strengthened with fixed expected positions rather than computing expectations through the helper, including lane/geometry resets that visibly differ from a retained position. The final `npm run check` passed TypeScript, zero-warning lint and **632 tests / 58 files**; `npm run export:android` and `git diff --check` also passed. No replacement optimized APK has been built or installed for this candidate. Physical stationary/rotation acceptance, controlled release-like performance comparisons, device request counting and the field scenarios above remain open.

### ADB follow-up blocked by secure keyguard — 2026-10-24

At 12% charge, 35.3°C battery temperature and thermal status 0, with battery saver enabled, brightness 91 and the existing 1080×2400 / 420 dpi configuration, the original standalone preview recorded `am start -W` cold Activity `TotalTime: 1131 ms`, `WaitTime: 1135 ms`. A subsequent screenshot showed the light Explore map and current-location marker. Activity launch time is not time to meaningful content, and these cooler conditions differ from the earlier camera session; no before/after performance claim follows.

The installed standalone APK was pulled through ADB and its SHA-256 matched `f8dc8bc297ee45989950b7fdb741865bf45e5fac2aac1fa923ee254cabf53164`. The checksum-verified Location development client was temporarily installed successfully. Metro completed the production-mode JavaScript bundle in 37,644 ms. Android then showed a secure keyguard (`showing=true`, `secure=true`), which ADB could not dismiss. Visible camera/label interaction and request-count scenarios therefore require the owner to unlock the device. A temporary request-name/timing diagnostic was prepared for this session; it does not establish counts without exercising the intended actions. No coordinates, credentials or provider content belong in its output.

Cleanup completed: `src/lib/edge.ts` was restored byte-for-byte (SHA-256 `3cdf54e52af8f98840ff0349f296cae3a933aac583aedfcd86c4d72a3a096c19`), no request diagnostic remains in `src`, and Metro exited. The temporary USB stay-awake setting returned to its original value `0`. Restoring the standalone APK with `adb install --no-streaming -r` returned Success; Android reports update time `2026-10-24 06:43:46`, no `DEBUGGABLE` flag, and the installed APK again matches the `f8dc8bc2…` SHA-256 above. No candidate acceptance, device request count, or sensor smoothness result was obtained through the locked screen. The owner was asked to unlock it for the next attempt.

The outstanding acceptance gates remain:

| Gate | Evidence still needed |
|---|---|
| Label stability | Owner holds the unlocked phone on visible labels, then slowly rotates and performs 90°/180° turns; verify placement and taps in the final optimized APK. |
| Sensor degradation/recovery | Physical poor/unavailable heading, stale GPS, permission revocation, background/resume and subscription recovery; deterministic regressions alone do not establish real sensor behavior. |
| Navigation/loading performance | Matched startup, tabs, Map/Camera entry, Search/Details/Walk, sheet, Settings and resume measurements under comparable conditions. |
| Paid request behavior | Device-observed explicit-action counts and durations, then zero additional calls through navigation, foreground, reconnect and language changes; existing cost tests remain supporting evidence. |
| Resource use | Comparable release-like camera/map navigation and memory/thermal/battery soak. |
| Delivery | Commit only after device verification, update draft PR #21 to the accepted presentation, build/install the final standalone APK, and record remaining outdoor field work. |

Documentation consulted: [Expo SDK 57 Location](https://docs.expo.dev/versions/v57.0.0/sdk/location/), [Reanimated timing](https://docs.swmansion.com/react-native-reanimated/docs/animations/withTiming/), [animation cancellation](https://docs.swmansion.com/react-native-reanimated/docs/core/cancelAnimation/), and the owner's HOP location/sheet implementations. Existing ARgala permission, cleanup and authority safeguards were preserved when adapting those references.

## Unlocked device and clarified readout complaint — 2026-10-24

The keyguard was subsequently dismissed, allowing the existing test client to load production-mode JavaScript. Conditions began at 12% charge, 36.2°C and thermal status 0 with battery saver enabled. An explicit Explore Search returned 20 results. A temporary diagnostic around `invokeEdge` recorded one `places-nearby` invocation taking 3,465 ms and no additional Nearby request during AR entry or location Retry. AR initially timed out and showed the localized accuracy/heading fallback, disabled Scan and no labels; explicit Retry recovered valid location/heading and adopted the compatible cached results. A later `place-details` invocation took 3,760 ms while the owner was interacting with the app; its exact gesture was not controlled, so it is not used to assert a duplicate-call defect or a complete cost-policy pass. These are client invocation timings, not server billing measurements.

After the owner moved near a window, a ten-second stationary recording showed the selected POI at a raw FOV boundary. In eight of ten 1 Hz snapshots its badge occupied the same right-hand horizontal stop; in two snapshots it legitimately left the FOV, causing the other badges to move up a lane. This demonstrates a separate layout effect. A focused regression reproduced surviving row tops changing from `[128, 256]` to `[0, 128]` dp; an isolated stable-lane experiment passed its tests but was set aside rather than deployed when the owner clarified the actual complaint. Raw FOV exit remains immediate.

**Clarification:** the owner said the label itself was fine and identified the rapidly changing degree number at the top as the annoying behavior. Earlier descriptions of rejected "label smoothing" must be read with this correction. Neither label interpolation nor horizontal snapping changed the compass samples or this numeric readout: the header still rounded every validated raw sample to the nearest degree.

The focused readout change displays circular 10° stops and holds the current number until the shortest angular difference exceeds 8°. It has no delay timer. State belongs only to `ArChrome`; raw heading still determines projection and validity, raw GPS still determines all geographic authority, and invalid/stale heading immediately clears the readout to the existing localized dash. Reacquisition starts from the new valid reading. No accuracy thresholds, provider requests, translations or native dependencies changed.

Real EN/KO/JA header regressions first failed on raw `233°` versus the calmer `230°` and `138°` versus `140°`. The same `[233, 235, 231, 229, 234, 232]` degree trace now holds `230°`; tests also cover buffered boundaries in both directions, north wrap, deliberate 90°/180° turns, invalid readings and fresh reacquisition. Final `npm run check` passed TypeScript, zero-warning lint and **639 tests / 59 files**. Android export passed. The numeric candidate loaded on the Galaxy A53 and a ten-second clip showed `150°` throughout; owner feedback on slow rotation is still pending. This is production-mode JavaScript in the development client, not acceptance of a new optimized APK.

Native AppOps showed camera use running on AR and a completed duration without `running` after returning to Map. Parsing only current provider-listener sections of `dumpsys location` showed one target GPS request in foreground and zero after Home/background. Historical request logs were excluded from that count; scanning the whole dump would incorrectly count old requests. Camera remained stopped in background. Broader heading-subscription, permission/reconnect, route and resource-soak scenarios remain open.

The temporary request diagnostic was restored byte-for-byte before the final checks. USB port forwarding disappeared during the session, causing the development launcher to fail to connect to localhost; Metro was still healthy and restoring `adb reverse tcp:8081 tcp:8081` recovered loading. This was a test-harness connection failure. Videos/screenshots remain temporary and are not committed. Battery declined to 6% during the extended camera session despite USB charging; differing build/pose/temperature and no controlled power measurement prevent attributing that drain to a regression or claiming a battery improvement.
