# ARgala client review follow-ups

User-requested work, queued after the current performance/sensor testing. This records requirements, not approval of a navigation algorithm or new preview build.

## Execution order and approvals

1. Finish testing the current optimization changes.
2. The owner explicitly authorized merging optimization PR #21 **after** that testing and required checks pass. Merge it before implementing these features. Preserve incremental history and do not bypass repository protections.
3. Re-read `AGENTS.md`, current main and outstanding AR/sensor/map/animation PRs. Implement against the latest stable main; avoid overlapping shared-file edits.
4. Deliver two independent, reviewable PRs: A for enhanced AR information, B for live walking navigation. Do not automatically merge those feature PRs.
5. Ask the owner before **each** preview APK build. Previous build approval or a general feature/performance task is insufficient. Batch feature work before consuming EAS quota. Existing development-client testing is available.

Use existing React Native, Expo Router, UniWind, HeroUI Native, TanStack Query and Reanimated. Preserve Clean Explorer styling, existing architecture and sensor correctness. Use OpenCode Zen for straightforward UI/test work when adequate, otherwise GPT-6 Luna. Reserve deeper reasoning for geography, sensor correctness and navigation lifecycle.

The owner is temporarily unavailable and delegates routine decisions. Prefer simpler, stable behavior over complex feature-complete machinery, while preserving geographic correctness and explicit uncertainty. The phone may power off; monitor its battery, keep checks brief and record any physical-test limits rather than blocking independent code/tests. Preview-build approval is still required.

## Phase 0: inspect existing implementations

Before implementation, inspect current AR labels/projection, selection, bottom sheet, location/heading hooks, Directions screen, route/session state and native Maps components. Recheck relevant PRs and main.

Inspect `~/Source/internship/HOP-Driver` as the primary navigation reference. Identify exact files responsible for Turf trimming, GPS-to-route projection, cumulative progress, displayed coordinate updates, GPS inaccuracies and deviations. Understand original-route storage, progress updates and map efficiency. Adapt its proven approach to walking, excluding ride-hailing/vehicle/driver behavior; do not introduce a cross-project dependency. Document pedestrian-specific differences. If the reference is unavailable, report that limitation and use supported Turf APIs with equivalent tests.

## PR A: enhanced AR floating information

### Intent

Show useful real location information over the live camera without requiring the bottom sheet first. **Retain the nearby-places bottom sheet.** Floating cards complement it.

### Compact labels

- Name and approximate distance.
- Subtle category/POI icon only if supported by actual data.
- Readable type, rounded surfaces, sufficient contrast and subtle elevation; avoid large cards obscuring the camera.

### Rich selected/eligible cards

For a selected POI or one within the configured activation radius, prioritize name, approximate distance, actual address or concise real description, a clear selected/within-range state, and an intuitive further-details action. Omit unavailable fields; never invent descriptions or data. Cards may be slightly larger, but remain concise and camera-first.

Within the activation radius, use richer eligible presentation only when sensor quality permits. Outside it, retain compact nearby labels and manual inspection. Clearly communicate when nothing qualifies. Do not gate opening AR by distance from a destination. Preserve the existing device-local activation-radius setting and raw authoritative geographic eligibility; visual smoothing cannot authorize activation.

### Selection, cost and presentation

- A tap selects the stable provider ID; floating card and sheet reference the same POI and reflect selection consistently.
- Retain manual selection rather than replacing it unexpectedly with a nearer POI.
- A selected-card tap may use existing Place Details navigation.
- Heading/selection changes must not introduce paid requests; preserve existing complete-response/language/age reuse and explicit recovery rules.
- Preserve bearing projection, freshness, accuracy thresholds, maximum label count, collisions, current visual smoothing/stops, safe areas, sheet occupation and accessibility.
- Unreliable heading must remove misleading directional overlays and leave nearby-list discovery usable.
- No object recognition, visual tracking, spatial anchors or fake 3D placement.

### Acceptance and tests

Information appears directly on camera; selected/eligible cards are visibly richer; ordinary pills stay compact; sheet remains functional and synchronized; no unintended API usage or camera/sensor performance regression. Test light/dark scenes, legibility, manual selection, sheet synchronization, GPS/compass fallback and cost guards through actual components and ADB.

## PR B: Start Navigation with local Turf route trimming

### Intent and entry

Extend existing Walking Directions preview with explicit **Start Navigation**. Reuse the successfully acquired Google walking route. Do not automatically start on opening Directions or continuously recalculate routes.

Start appears only with a successful valid route, usable geometry, reliable current location and no active navigation session. Keep a small clear state model:

- Preview: route available, navigation not started.
- Navigating: live route progress active.
- Location uncertain: quality insufficient to advance safely.
- Off route: reliable evidence of deviation.
- Arrived: trustworthy destination arrival confirmed.
- Stopped: explicit Stop returns to preview with the full original route.

### Original route and progress algorithm

Preserve original Google route geometry unchanged as the reference. For a fresh validated GPS/watcher sample:

1. Project onto original geometry with `nearestPointOnLine` or the proven HOP-Driver equivalent.
2. Determine cumulative progress along the original route.
3. Extract remaining geometry with `lineSliceAlong` or the reference equivalent.
4. Render remaining coordinates and repeat locally on suitable GPS updates.

React Native Maps coordinates are latitude/longitude objects; Turf coordinates are longitude/latitude arrays. Make conversions and distance units explicit and correct. Check installed Turf version and actual returned progress properties. Prefer modular Turf packages over the full library when suitable; use Expo-compatible installation and current documentation.

### Correctness under noisy GPS

Do not immediately trim for every projected point. Consider accuracy, timestamp freshness, continuous watcher health, route-corridor distance, implausible speed/jumps, small backward fluctuations, genuine backward walking, self-intersections and overlapping segments.

Prefer stable monotonic completed progress with bounded noise tolerance, so minor backward fluctuations do not redraw completed segments. Do not keep advancing during genuine backward movement, deviation or unreliable GPS. Retain the last trustworthy progress only as visibly qualified historical state during uncertainty. Do not present stale/snapped coordinates as current physical position. Avoid complex sensor fusion without evidence.

### Off route and arrival

Reliable samples substantially outside an accuracy-aware route corridor stop progress, preserve original/last trustworthy route context, and display a concise warning. Do not declare off-route status from one noisy sample, force the user marker onto the route, or automatically reroute. Choose thresholds from reported accuracy, geometry, deterministic tests and real walking observations. Propose manual recalculation separately if needed.

Arrival requires trustworthy physical samples near the destination and corroboration; reaching a final snapped vertex or one poor fix is insufficient. Show an accessible arrival message, end active progress tracking, preserve destination context, and allow return to Map/Details.

### Map and sheet

Retain Google styling and attribution. Show the live raw user position, destination and highlighted remaining walking line. Following is optional, must permit manual panning and a Recenter/Resume Following action, and must not aggressively recenter on every sample. Preserve Fit Route and safe padding around controls/sheet.

While navigating, prioritize destination, remaining route distance, status, relevant uncertainty/deviation warnings and Stop Navigation. Keep the UI clean and map-first. An honestly derived remaining-time estimate is optional and must be labeled as estimated. Never fabricate turn instructions, roads or voice guidance from a polyline. Stop restores the existing full-route preview interface.

### Lifecycle, privacy and provider costs

Reuse existing location infrastructure without duplicate subscriptions. Preserve permission handling, continuous watcher health, freshness, error recovery and async cleanup. Navigation runs only while Directions is focused and foregrounded; suspend on blur/background and revalidate permissions/quality before resumed advancement. Do not persist precise location history or add background navigation.

Start Navigation, GPS samples, local trimming, foreground resume, navigation state and map/Reanimated updates must not request Google Routes again. Preserve explicit request authority, disabled TanStack observers, no automatic retry/refocus/reconnect fetch and bounded transient provider caching. The initially acquired route remains the geometry source of truth.

### Deterministic and device validation

Test pure geography independently from Maps/native boundaries, then real hook/screen lifecycle and UI/cost paths. Trace cases:

1. Stationary GPS drift.
2. Normal walking along the route.
3. Small backward fluctuations.
4. Genuine backward walking.
5. Sharp turns.
6. Route intersections/overlapping segments.
7. Large GPS jumps.
8. Temporary accuracy loss.
9. Leaving the intended route.
10. Returning to the route.
11. Approaching and reaching the destination.
12. Background/resume and interruption.
13. Explicit Stop restoring full geometry.

Confirm progressive trimming without oscillation, no stale current-position claims, no reroute/refetch side effects, appropriate uncertainty/off-route/arrival state and safe resume. Verify through ADB and outdoor walking where feasible; document outstanding physical verification rather than claiming mocks establish field behavior.

## Delivery and reporting

Use coherent Conventional Commits and applicable full/project/Android checks. PR A covers information model, rich/compact card design, sheet synchronization and layout/sensor/cost regressions. PR B covers exact HOP-Driver reference files, pure progress helper, trace tests, state/lifecycle, remaining polyline, UI and Android verification.

For each PR, report implemented behavior, reused functionality, reference patterns, material design decisions, commits, checks, ADB results, remaining field scenarios and limitations. Keep provider credentials, location history and camera frames out of Git. Ask before a preview build; do not merge feature PRs automatically.

Non-goals: automatic rerouting, repeated Routes calls, voice guidance, unsupported turn-by-turn instructions, background tracking, 3D anchors, camera recognition, location-history storage or new state-management infrastructure.
