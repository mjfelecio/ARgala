# Foreground walking navigation design

PR B starts independently from merged main `101e450`, without PR A. The owner prefers stable, simple decisions and is unavailable. No preview build or automatic feature merge is authorized.

## Reference and scope

Inspected HOP-Driver's `features/booking/active-booking/utils/sliceRouteData.ts`, `hooks/useSnappedCoordinates.ts`, `useTripProgress.ts`, `useNavigationalMapLogic.ts`, `useNavigationSession.ts`, `useNavigationStepsCoordinator.ts`, `useDriverRoutes.ts`, `useReroutingDetection.ts` and `utils/locationUtils.ts`. Adopt immutable original geometry, explicit longitude/latitude conversion, Turf nearest-point projection, local slicing and corroborated off-route detection. Exclude poor-accuracy force-snapping, vehicle camera/speed thresholds, automatic rerouting, voice, ride stages and arrival based only on a snapped endpoint.

Use modular Turf packages installed through Expo. Current fetched Turf documentation and installed declarations expose `totalDistance`, `pointDistance` and `segmentIndex` (7.4 API); pin implementation to installed versions and test units/endpoints. Expo remains SDK 57; no native module or background permission is added.

## Progress and authority

Keep original decoded coordinates/reference unchanged. Prepare a pure route with cumulative segment distances. A pure tracker consumes raw positions with native timestamps, continuous watcher health, accuracy and current foreground ownership. No display-smoothed coordinate can advance progress. Native sample age is capped at 10 seconds and accuracy at 25 m, stricter than preview acquisition. Duplicate, future, one-shot-only and stale readings cannot advance or corroborate progress.

Match route segments with Turf nearest-point projection in meters. Reject ambiguous matches on distant portions of overlapping/self-intersecting geometry. Use a bounded local along-route window after acquisition and reject implausible walking displacement. A new anchor needs two consistent distinct samples. Progress is monotonic with an accuracy-aware movement deadband; forward jumps exceeding elapsed walking speed plus 6 m require a second compatible reading even when reported accuracy would permit the displacement; backward movement updates matching continuity without revealing completed geometry or advancing the historical high-water mark. Poor readings retain historical progress with an uncertainty notice. Foreground/focus interruption invalidates continuity and requires fresh corroboration; it never reacquires a paid route. Rejoining more than 75 m along the route after an interruption remains uncertain; the UI explains Stop and Start as recovery using the same original route.

Off-route status requires three reliable distinct samples outside an accuracy-aware corridor; the first violation already pauses progress. Returning requires corroborated on-route samples. Arrival requires multiple fresh accurate raw positions physically near the captured destination and near the end of the route; a projected final vertex alone is insufficient. Stop restores the complete original route. Thresholds are conservative starting values covered by deterministic traces, pending outdoor walking calibration; no claim of real-world navigation accuracy is made from mocks.

## Lifecycle, presentation and cost

Add a small hook that consumes the existing preview's location owner and expiry clock. It creates no sensor subscription, query or provider call. Start is explicit, available only for usable geometry and current reliable location. Screen blur/background immediately suspends presentation and matching; foreground revalidates existing permission/watcher gates before fresh progress. Arrival ends progress processing; existing preview location ownership remains solely for the live map/Recenter. No precise history is persisted.

Keep the existing native map and Google styling, raw live location layer, destination, padding and gestures. Pass remaining geometry separately from original fit geometry so GPS progress cannot trigger automatic fit/recenter. Retain explicit Fit Route and Recenter; omit optional following mode to avoid unnecessary camera motion. Sheet shows destination, approximate remaining geometry distance, translated status/warnings and Stop; arrival offers return to preview. Preview retains existing route estimate/warnings/credits. No invented turn instructions or progress ETA.

Start, progress, stop, refocus, reconnect and language changes spend no provider quota. Existing intent/lease/TanStack rules remain unchanged. Completed snapshots remain transient and original request origins/destinations stay captured.
