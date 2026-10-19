# ARgala — Walking Directions / Route Preview Implementation Plan

> Execution: tasks 1–4 completed in separate validated commits; task 5 automated checks and documentation recorded in `docs/validation.md`. Physical Android acceptance remains NOT TESTED.

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement this plan one task at a time. Track checkboxes, run red/green tests, and commit after each cohesive unit. Reconcile exact files with current main before editing.

**Goal:** Deliver the approved compact Walking Directions screen (Stitch R01), reachable through one explicit **Get Directions** action in POI Details, reusing existing Google Routes functionality without duplicate provider charges or disrupting Home/AR.

**Architecture:** A protected parent-stack `directions` route displays its own native Google map and small docked route summary, without duplicating route acquisition or building a navigation engine. A short-lived, one-time in-memory user intent authorizes at most one Google Routes request after the preview obtains a **current foreground GPS fix**. An already completed Home Map route is handed to the preview as data, not fetched again. No route API call occurs solely because a user deep-links, remounts, refocuses, resumes, or changes language.

**Tech stack:** Expo SDK 57, Expo Router protected Stack + Tabs, React Native Maps, Google Routes through existing Supabase Edge Function, TanStack Query, Expo Location, UniWind/Tailwind CSS v4, HeroUI Native, `global.css`, Ionicons, i18next, Vitest. Android only.

**Sources:** `AGENTS.md`; `docs/design/clean-explorer/{DESIGN_SYSTEM,SCREEN_SPECIFICATIONS,SCOPE_AND_DECISIONS}.md` (R01 subsection); Stitch `argala_walking_directions_route_overview/screen.png` approved (left reference). The expanded Stitch route export is deliberately **not** the target.

**Verified baseline:** `main` at `a84c2159a27470ac86b247cabb12abbbc629e404` (2026-10-19); PR #9 and PR #10 merged. Recheck latest `main` and local workspace status before executing. Use existing `ARgala` root, no nested app.

## Global constraints

- Respect original direct-client requirements and later SRS additions; dynamic Google POI discovery stays unrestricted by any nine-site catalog.
- Preserve existing Google Places/Routes authentication, request limiter, typed contracts, errors, locale, permissions, and query lifecycle. Do **not** modify Edge Functions or Places fields for this UI feature.
- Use real native Google Map + provider polyline; never display a static Stitch map, straight-line fallback masquerading as a route, or fabricated POI data.
- The route is a **walking preview snapshot**, not turn-by-turn, real-time GPS guidance, automatic rerouting, ETA arrival clock, traffic, elevation, accessibility claims, or guaranteed walkway safety.
- `global.css` remains the sole theme source. Use UniWind + HeroUI Native for controls, cards and surfaces. Use native layout style props only for map padding, coordinates, map instance measurements, and other dynamic native geometry; no new TypeScript theme object or homegrown button library.
- Do not add packages without verified necessity; `react-native-maps`, `@gorhom/bottom-sheet`, `heroui-native`, Ionicons, and Expo Location are already present.
- Preserve Map's existing explicit Search, selection, Walk, map fitting, docked sheet, Google attribution, and AR handoff. AR sensor tracking and the camera are outside this task.
- App-owned user-facing strings and fallbacks in English/Korean/Japanese locale files. Render a provider warning only when returned; keep the standard localized walking caution. Never display raw errors.
- No persistent Places/Routes cache, location history, camera frames, or new backend tables. Short-lived route intents and route results reside in the existing transient query/client lifecycle and disappear at logout.
- Work in `feat/walking-route-preview`; scoped PR to `main`, never auto-merge. Conventional Commit after every validated logical unit.

## Review focus — must be tested

1. **Untrusted direct route / stale token:** opening `/directions` with no valid unconsumed user-intent does not call Google; show actionable local state rather than invent an origin or destination.
2. **One-tap cost control:** Details `Get Directions` sets a single-use intent; a delayed GPS permission/fix allows **at most one** Routes call for that intent. Focus/resume/remount/re-render/language change cannot initiate a second one.
3. **Map result reuse:** tapping View Route on an existing successful map route opens its preview using the exact origin, destination and decoded polyline, with **zero new** Routes calls.
4. **Location validity and failures:** no current GPS fix, permission denial, revoked grant, timeout, no provider route, malformed polyline and upstream errors yield honest user-recoverable states; no stale position presented as an accurate route origin.
5. **Native presentation:** route fits inside the measured viewport above the docked sheet/header, after MapView is ready; no overlap with provider legal attribution or Android insets. On phone rotation/short height/150% text, route remains inspectable.

---

## Task 1 — Route-preview navigation + transient user-intent contract

**Files:**
- Create `src/app/(app)/directions.tsx` (thin protected route).
- Create `src/features/directions/route-preview-intent.ts` (only transient handoff and consumption).
- Create `src/features/directions/route-preview-intent.test.ts`.
- Modify `src/app/(app)/_layout.tsx` to register the stack route with no duplicate navigator header.

**Interfaces:**
- Input: existing `Place` (`providerId`, coordinates, name, optional address), optional already-returned `{origin: Coordinate; route: WalkingRoute}`.
- Output: `createRoutePreviewIntent(queryClient, place, options?) -> token` and `claimRoutePreviewIntent(queryClient, token) -> intent | null`. The intent has source and creation time; claims are single-use. Define the concrete types here and reuse them in later tasks; do not introduce a second Place/WalkingRoute model.
- Lifetime: finite, short-lived, memory-only. Use TanStack Query's existing transient lifecycle and ensure `queryClient.clear()` invalidates all route-intent data on auth change. Tokens are not authorization tokens and must not be persisted.

- [x] Write tests: create/claim once; unknown/expired/invalid token cannot authorize a request; an existing route payload is retained without change; clearing QueryClient removes pending intent.
- [x] Run focused test, observe RED.
- [x] Implement validated transient handoff and protected screen registration; no paid API calls in route registration.
- [x] Run focused tests and `npm run typecheck && npm run lint`, observe GREEN.
- [x] Commit `feat(directions): add one-time route preview handoff`.

## Task 2 — Dedicated route-preview screen and real native map

**Files:**
- Create `src/features/directions/route-preview-screen.tsx` (screen state, source, navigation).
- Create `src/features/directions/route-preview-map.tsx` only if it keeps map geometry separate and focused.
- Create `src/features/directions/route-preview-screen.test.tsx`.
- Reuse `src/features/directions/{service,polyline}.ts`, `src/features/location/use-device-location.ts`, `src/lib/edge-error.ts`, `src/features/places/selection.ts`.

**Interfaces:** React screen receives the token from protected route, claims the transient intent, and obtains current foreground location using the existing device hook; when a successful route was handed off, render it without requesting again. Route data uses existing `WalkingRoute` and decoded `Coordinate[]`. The origin is the actual location used when the route was computed, not an arbitrary current marker location.

- [x] Write RED tests: no auto-request from bare/invalid deep link; source and destination accurately rendered from successful route; native `MapView` receives blue polyline and a green destination marker; no route fabricated for zero routes.
- [x] Implement map-based overview with minimal header, accessible Back to Map, Recenter, Fit Route, current-location marker and destination marker. Use real native Google Map and CSS-resolved route/marker colors.
- [x] Map readiness + measured sheet/header determine `mapPadding` and `fitToCoordinates`; avoid calling native padding setters before `onMapReady`. Show map loading/configuration states, no duplicate tabs, no unnecessary map instance in the existing Home route.
- [x] Run focused tests, `npm run check`, commit `feat(directions): render walking route preview map`.

## Task 3 — One-tap intent consumption and safe routing state machine

**Files:**
- Modify `src/features/directions/route-preview-screen.tsx`.
- Add/extend `src/features/directions/route-preview-screen.test.tsx` and transient intent tests.

**Interfaces:** A valid, newly claimed user intent authorizes **one** `routeService.walking({origin,destination,language})` request only after a current usable foreground GPS fix is available. Reuse the existing typed walking route/query conventions and `decodePolyline`. Handle pending/no permission/error/route success explicitly. Locale changes affect labels, not provider request authorization. Retry is a new explicit tap after failure.

- [x] RED tests: pressing Details Get Directions then waiting for GPS triggers once; successive focus/foreground/remount/locale changes do not repeat; rapid double tap does not create duplicate route requests; stale/denied GPS does not invoke provider; explicit Retry after failure is allowed.
- [x] Implement state machine with idempotent intent consumption and unambiguous last-request status. No generic enabled-on-mount `useQuery` for paid requests; no automatic refetch on focus or language changes. On route success retain its captured origin and data.
- [x] Use localized loading/no-location/no-route/failure/retry states; route warning display is driven by returned warning list plus the standard caution.
- [x] Run tests, `npm run check`, commit `feat(directions): request explicit one-tap walking previews`.

## Task 4 — Connect POI Details and existing Home route results

**Files:**
- Modify `src/features/places/place-details-screen.tsx`.
- Modify `src/features/map/place-sheet.tsx` and `src/features/map/map-screen.tsx` minimally to expose an existing successful route as a preview without fetching again.
- Test `src/features/places/place-details-screen.test.tsx` and `src/features/map/map-screen.test.ts`; add specific route handoff assertions.

**Interfaces:**
- POI Details primary **Get Directions** action creates a route intent for its *currently selected* Place, then pushes protected `/directions?token=...`. **View on Map** and **Open AR** preserve existing behavior.
- On Home Map, existing **Get walking route** remains and still renders locally; after route success, expose a real **View Route** action. That action passes the already returned `WalkingRoute`, the corresponding request's original `origin`, and selected Place to Route Preview. It makes no second paid call.
- Existing AR direct Directions-to-Map behavior may remain; AR → Details → Directions provides complete one-tap flow. Do not refactor camera sensors here.

- [x] Write RED tests: Details primary action goes to preview; secondary actions remain; map route result's origin, target and polyline match preview; 0 new provider requests from View Route; preserves map selection and Back after route preview.
- [x] Implement the smallest navigation hookups and clear temporary intent when target changes or user logs out. Do not duplicate service modules or mutate the global Places DTO.
- [x] Run all affected Map/AR/Details regressions and `npm run check`, commit `feat(navigation): connect walking preview to place details and home`.

## Task 5 — Compact Stitch R01 presentation, localization, and Android QA

**Files:**
- Modify `src/features/directions/route-preview-screen.tsx` (and map file if split).
- Modify `src/i18n/locales/{en,ko,ja}.json`.
- Modify `docs/validation.md`; add brief `docs/design/clean-explorer/ROUTE_PREVIEW.md` explaining approved R01, intentional differences, cost boundaries and Android test cases.
- Change `global.css` only if an approved shared semantic token is genuinely missing.

**UI composition:** Map dominates. White/minimal header reading "Walking Directions"; blue route, real origin marker, green destination. Compact docked sheet with walking mode, returned distance/duration, selected destination name/address, standardized caution/warnings (possibly expandable for actual warning text); two visual actions: **Back to Map** (secondary) and **Place Details** (primary or design-approved hierarchy). Recenter/Fit icons have accessible labels. Standard Plus Jakarta Sans and HeroUI Button/Surface/Chip; no custom `PillAction` or StyleSheet theme.

- [x] RED tests for route/loading/empty/error states, long destination name, missing address, distinct walking vs straight-line values, returned warnings, attribution visibility, locale resources (en/ko/ja), and 150% text layout where component tests can inspect semantics.
- [x] Implement compact R01 layout. Avoid extra Share/Profile, fake Flat Terrain, “optimal route”, “arrives at 2:45 PM”, Start Navigation, ratings, open hours, and other Stitch extras.
- [x] Run targeted tests and `npm run check`, `npm run check:android`, `npm run export:android`, `npx expo install --check` (and Expo Doctor if native dependency or config changed); record actual output, not expected output.
- [ ] Physical Android smoke: Details → Get Directions (one route request) → route overview → Place Details → Back; Map existing route → View Route (zero new call); short/large text, map legal labels, fit/recenter, GPS denied/stale, provider no-route/timeout; insets/gesture nav. If unavailable, report **NOT TESTED** and do not assert UAT completion.
- [x] Review against approved R01 screenshot; document remaining deviations without using static map imagery. Review all diffs, `git diff --check`, coherent docs commit `docs(directions): record route preview validation`, push branch and prepare an unmerged PR targeting latest `main`.

## Acceptance criteria

- Protected Walking Directions overview screen, not another tab and not a simulation.
- One-tap POI Details → Route Preview; only the associated explicit intent can initiate one paid request after usable GPS. No auto provider requests via bare navigation/refocus/locale/invalidation.
- Home Map retains working Walk route and can open the approved preview from an already returned route without another paid call.
- Actual route is drawn from provider polyline, real computed-origin and destination are distinguished, fit-to-route respects layout, Google/legal attribution remains accessible.
- Loading, missing GPS, denied permission, no route, malformed response, failure/retry and Back all work without fake route claims.
- UniWind/HeroUI + centralized `global.css`; no new dependencies unless justified; Android-only Expo 57 remains compatible.
- Existing auth, Map, POI Details, AR, query/permission contracts and prior tests remain unaffected; incremental commits, green applicable checks, human-reviewable PR **not automatically merged**.

## Execution handoff

Work on the dedicated `feat/walking-route-preview` branch from current `main`. Implement tasks in order with red/green tests, no giant dump commit; independent review before merge. Verify exact current API signatures first and adapt any stale file paths deliberately. The companion kickoff prompt in this package can be given directly to a coding agent.
