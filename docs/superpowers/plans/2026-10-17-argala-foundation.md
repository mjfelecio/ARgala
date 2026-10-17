# ARgala Foundation Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement task-by-task in place. Steps use checkbox syntax.

**Goal:** Deliver a reviewable Android foundation matching both supplied briefs.
**Architecture:** Feature screens use typed device/API services. Auth and preferences are contexts; server state is transient TanStack Query data. Supabase Edge Functions protect Google web-service keys.
**Tech Stack:** Expo 57, Router, React Native, strict TypeScript, Supabase, Google Maps/Places New/Routes, Zod, Vitest, i18next, EAS.
**Spec:** docs/superpowers/specs/2026-10-17-argala-design.md

## Global Constraints

- Existing ARgala root, Android only, Expo SDK 57; no nested app/worktree.
- main contains scaffold; feat/app-foundation contains implementation; private mjfelecio/ARgala; unmerged PR.
- Conventional incremental commits after validation; no secrets.
- Dynamic POI discovery for any center; no tourist-only restriction or fabricated results.
- Server Google keys only in Edge secrets; foreground sensors only; no location history/camera storage.
- AR activation radius initially 100 meters, separate from discovery radius and future destination filter.

## Review Focus

- Permission denial, unavailable sensors and late subscriptions must not crash or leak watchers.
- Logout/session changes must remove protected routes and prior query data.
- Invalid coordinates, excessive request sizes and unauthenticated calls must not reach Google.
- Multiple Edge instances must enforce a shared rate limit before paid requests.
- Empty results/unavailable routes and malformed upstream payloads must display honest errors.

### Task 1: Scaffold and remote
**Files:** Expo template at root, .gitignore, package-lock.json.
**Interfaces:** Produces runnable Expo 57 Router scaffold and main remote tracking.
- [x] Initialize Git first, scaffold using default@sdk-57, install locked dependencies.
- [x] Validate scaffold manifests and staged files before the initial commit; run compiler/lint after dependency installation (completed on implementation branch following registry recovery).
- [x] Confirm mjfelecio authentication and absent remote; create private repo and push main.
- [x] Switch to feat/app-foundation.

### Task 2: Tooling and configuration
**Files:** app.config.ts, eas.json, .env.example, eslint.config.js, vitest.config.mts, src/config/*, docs/*.
**Interfaces:** Produces validateEnvironment(input), centralized radius/limits and shared UI.
- [x] Add Zod/Vitest and Expo-compatible dependencies required by tooling.
- [x] Test missing/malformed environment values; implement validation and setup state.
- [x] Configure Android-only plugins/permissions, EAS development and APK preview.
- [x] Run typecheck, lint, tests and Expo config; commit.

### Task 3: Authentication
**Files:** src/features/auth/*, src/lib/supabase.ts, src/app/_layout.tsx, src/app/sign-in.tsx, src/app/(app)/*.
**Interfaces:** useAuth() returns session/loading/error; getSupabase() returns configured singleton or null.
- [x] Implement persisted Supabase client, foreground refresh and auth provider.
- [x] Implement sign-in/registration/email-confirmation/logout, guarded screens and failures.
- [x] Check typecheck/lint/tests and review session bootstrap/unsubscribe/logout; commit.

### Task 4: Location
**Files:** src/features/location/{geo,service,use-device-location}.*, geo.test.ts.
**Interfaces:** Coordinate, distanceMeters(a,b), bearingDegrees(a,b), normalizeHeading(n), relativeHeading(bearing,heading), isWithinRadius(a,b,r); useDeviceLocation() returns permission/position/heading/status/retry.
- [x] Write geo tests for same points, equator, dateline, wraparound, boundaries and invalid finite/range inputs; run red.
- [x] Implement pure utilities; run green.
- [x] Implement foreground permission/current/watch/heading services with timeout, accuracy and cleanup handling.
- [x] Validate typecheck/lint/tests; commit.

### Task 5: Places
**Files:** supabase/functions/_shared/*, places-nearby/index.ts, place-details/index.ts, supabase/migrations/*, src/features/places/*.
**Interfaces:** Place schema; NearbyRequest(center,radiusMeters,language); placesService.nearby(request), details(providerId,language).
- [x] Write request/normalization/handler tests for valid/invalid coordinates, 20-result bound, no type restriction, attribution, upstream failures, auth/limits; run red.
- [x] Implement shared Zod contracts and Google handlers, authenticated HTTP wrapper, atomic database limiter and client service.
- [x] Add Supabase configuration, migrations and deployment notes.
- [x] Run typecheck/lint/tests and Edge checks; commit.

### Task 6: Walking routes
**Files:** supabase/functions/walking-route/*, _shared/routes.ts, src/features/directions/*.
**Interfaces:** WalkingRoute(distanceMeters,durationSeconds,encodedPolyline), routeService.walking({origin,destination}).
- [x] Write tests for Google's example polyline, truncation, WALK request, normalized distance/duration, no routes and upstream errors; run red.
- [x] Implement route handler, schemas/service and decoder; run green plus typecheck/lint; commit.

### Task 7: Maps
**Files:** src/features/map/*, src/app/(app)/index.tsx.
**Interfaces:** Consumes device location, Places service and route service.
- [x] Implement Google map with permission/loading/retry states, current position, recenter/camera/settings controls.
- [x] Add explicit nearby refresh, POI markers/native POI click, selected details and walking polyline with attribution/caution.
- [x] Validate types/lint/tests and Android export; commit.

### Task 8: Camera
**Files:** src/features/ar/*, src/app/(app)/ar.tsx.
**Interfaces:** Consumes device position/heading and shared settings.
- [x] Implement focused foreground CameraView with permission/retry/settings and unavailable camera/heading fallback.
- [x] Add development diagnostics and no capture/persistence.
- [x] Validate typecheck/lint/tests and export; commit.

### Task 9: Settings/localization
**Files:** src/features/settings/*, src/i18n/*, src/app/(app)/settings.tsx.
**Interfaces:** useSettings() exposes activationRadiusMeters/language and validated setters.
- [x] Write tests for 100m default, radius validation and supported/fallback locales; run red.
- [x] Implement persisted settings, separate resource files and i18next initialization; integrate UI strings.
- [x] Document future catalog center integration; validate types/lint/tests; commit.

### Task 10: Acceptance and delivery
**Files:** README.md, docs/validation.md, CI workflow, PR body.
**Interfaces:** Reviewable branch and explicit configuration/validation evidence.
- [x] Review whole branch against briefs; address material defects and run all available validation.
- [x] Inspect Android prebuild manifest and bundle, dependency checks and Edge types.
- [x] Document checks and external/hardware limits; commit/push branch.
- [ ] Create PR targeting main; verify private repo, branch tracking, remote commit and open unmerged PR.
