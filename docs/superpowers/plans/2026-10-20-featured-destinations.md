# Featured Destinations & Daytime Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Each task has independently checkable `[ ]` steps. Verify each task and commit it before the next.

**Goal:** Add the nine-site catalog, daytime photo previews and destination-centered nearby/directions flows while preserving the working general-purpose ARgala app.

**Architecture:** A bundled typed `destinations` feature owns the nine approved study IDs, optional verified location/media/translation fields, and its own destination-centered search radius. Protected catalog/detail pages use Expo Router and existing UniWind/HeroUI. Cross-feature navigation reuses the existing Google Places and route-preview services; no backend redesign or new Google photo fields.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, Expo Router, UniWind 1.12.x, HeroUI Native 1.0.10, `global.css`, TanStack Query, expo-location existing hooks, i18next, Vitest, Google Places through Supabase Edge Functions, current walking route-intent service.

**Spec:** Accompanying `ARgala_Featured_Destinations_Design_Spec.md`; repo `docs/design/clean-explorer/SCREEN_SPECIFICATIONS.md` section D01 and `docs/extending-discovery.md`; attached Draft 1.0 SRS §§3–5. Reference: `reference/destination-daytime-preview.png` and `reference/stitch-code.html`, as design reference **only**.

**Baseline:** GitHub `mjfelecio/ARgala` main `be3971b4dc9d57e6e2cc56ffe3e0aa899f86fa84` (PR #12 AR camera UI merged, checked 2026-10-20 PH time). Start from *latest* `origin/main`, inspect drift and existing tests; do not hardcode this SHA as a requirement.

## Global constraints

- Android-only; stay on Expo SDK 57; do not change underlying Google Maps, camera sensor, auth, Edge, EAS or rate-limiter implementations just to build tourism pages.
- Approved green `#247A53`/dark `#174D38`/mint `#E7F4EC`, Plus Jakarta Sans and component tokens are already in `global.css`; use UniWind `className` and HeroUI Native components, not a separate TypeScript theme or giant custom primitives.
- **General nearby Google Places search remains available for any current location.** Nine-featured-destination catalog adds a path, it does not limit regular Home/AR discovery.
- Exactly SRS destination IDs D01–D09; SRS names provisional. No source-unsupported lat/lng, tourist descriptions, translations, photos, rights, open-now, road accessibility or reviews.
- Do not introduce a curated-data CMS, Supabase migration, new Places field-mask SKU, Google Photos endpoint, new login provider, speech translation, offline maps, 3D AR, or turn-by-turn navigation.
- Catalog lists and galleries are usable without location/camera permissions. Foreground GPS only on user-intent operations requiring user distance/route.
- Nearby around verified **destination center** uses **500m** fixed feature config; AR local 100m activation and user-centered 1000m search stay independent.
- Places/Routes requests occur only in response to explicit user gestures. No requests on screen mount, locale change, refocus, background return, page scroll, or provider query invalidation.
- Existing provider IDs/credits, sanitized localized error codes, memory-only Google results, Places 20-result limit and route walking warnings remain intact.
- Preserve current `/place/[providerId]` and `/directions` flows. Catalog IDs must never be passed to Google Place Details.
- Keep incremental Conventional Commits and an **unmerged PR**. Do not patch/merge unrelated tickets.

## Files and responsibilities (adapt to verified current layout)

| File | Responsibility |
|---|---|
| Create `src/features/destinations/catalog.ts` | Nine IDs/names, typed optional location/route entry/approved content/media, no fabricated values |
| Create `src/features/destinations/catalog.test.ts` | ID/field validation, missing data and localization fallback |
| Create `src/features/destinations/nearby.ts` | Pure center-distance eligibility and request shape, exact 500m threshold |
| Create `src/features/destinations/nearby.test.ts` | 499/500/501m, invalid coordinates, no-centre behaviors |
| Create `src/features/destinations/destinations-screen.tsx` | Protected nine-item catalog composition |
| Create `src/features/destinations/destination-screen.tsx` | Destination overview, daytime preview, actions and source states |
| Create `src/features/destinations/daytime-gallery.tsx` | Approved photo gallery, fullscreen viewer and empty fallback |
| Create `src/features/destinations/nearby-establishments.tsx` | Explicit nearby search, optional user distance, rows and attributions |
| Create `src/features/destinations/*.test.tsx` | Screen, navigation and explicit paid-call lifecycle regressions |
| Create `src/app/(app)/destinations/index.tsx` and `src/app/(app)/destinations/[destinationId].tsx` | Thin Expo Router wrappers |
| Modify `src/app/(app)/_layout.tsx` | Protected catalog stack routes; leave tabs intact |
| Modify `src/features/map/home-map-controls.tsx`, `src/features/map/map-screen.tsx` minimally | Catalog entry for ready and no-location/no-Maps fallback; map handoff only if verified |
| Modify `src/features/directions/route-preview-screen.tsx` only as needed | Return curated Route Preview to curated details, not Google details |
| Modify `src/i18n/locales/{en,ko,ja}.json` | Actual app labels, errors, visible English fallback |
| Create `docs/design/clean-explorer/DESTINATIONS.md` | Implementation choices, placeholder vs approved and source rights |
| Update `docs/validation.md` | Tests, actual device checks, missing client content gates |

Only split files when there is a substantive responsibility. Keep no custom UI kit; reuse components already present.

## Review focus — failure classes to test explicitly

1. **Nine names but no verified coordinates/media:** details and catalog open; photos/nearby/route actions do not lie or call Google.
2. **Destination-center ≠ user location:** eligibility always uses approved destination center; visually distinguish destination distance from user's optional GPS distance.
3. **Boundary 499/500/501m and Places limit:** filter using actual unrounded geodesic values, show at most returned 20, never claim exhaustive coverage.
4. **Missing or denied location, app refocus, locale change, deep link:** catalog stays navigable; no automatic Places/Routes calls or unapproved permission prompts.
5. **Curated route subjects and stale tokens:** single explicit request to verified entrance; return-to-details routes to correct curated ID; never call Google Place Details for a curated ID.

---

### Task 1 — Catalog data contract and content-readiness record

**Files:** `src/features/destinations/catalog.ts`, `catalog.test.ts`; create `docs/design/clean-explorer/DESTINATIONS.md`.

**Interfaces:** `DestinationId = 'D01'|...|'D09'`; `Destination` includes `id`, `provisionalName`, `verifiedName?`, `center?: Coordinate`, `routeEntrance?: Coordinate`, optional per-locale approved copy/media with credits; `getDestination(id:unknown): Destination|null`; `listDestinations(): readonly Destination[]`. Incomplete/missing data stays missing. `Destination` is **not** the Google Places `Place` type.

- [ ] Verify SRS IDs D01–D09 and spellings. Record aliases/uncertainty, never replace official name without approval.
- [ ] Write failing tests for exactly nine unique stable IDs in prescribed order, unknown ID, invalid/non-finite coordinate rejected, no fabricated coordinates/photos/copy, per-field approval handling, and visible English fallback behavior. Run RED: `npx vitest run src/features/destinations/catalog.test.ts`.
- [ ] Implement typed readonly manifest with the nine SRS names and nullable/optional content fields. Do not add guessed coordinates. Add a short content checklist template/reference for maintainer signoff. Use a small schema/guard to reject wrongly approved incomplete entries.
- [ ] Run targeted tests GREEN; `npm run check`; review diff and commit `feat(destinations): establish nine-site catalog contract`.

### Task 2 — Catalog entry and protected screens

**Files:** `src/app/(app)/destinations/index.tsx`, `[destinationId].tsx`; `src/app/(app)/_layout.tsx`; `src/features/destinations/destinations-screen.tsx`, `destination-screen.tsx`, tests; existing Home launch controls (including no-location fallback).

**Interfaces:** `/destinations`, `/destinations/[destinationId]` protected parent-stack routes; `DestinationScreen` obtains stable ID from Expo Router, resolves local manifest only. Home entry is real button; no extra tab and no new map provider call.

- [ ] Write failing navigation component tests: all nine listed, tap opens correct ID, direct URL works, invalid ID shows safe error + Back, Home with location denied or map key unavailable can open catalog. Run RED.
- [ ] Add one clear Featured Destinations entry to Explore without obscuring native map/legal label or sheet; entry also appears in its no-location/no-maps fallback. Do not add Saved/another tab.
- [ ] Implement compact native list and detail page with clear Back path, title and honest incomplete-data state. Use HeroUI Card/Button/Chip as suitable; UniWind tokens in existing `global.css`.
- [ ] Verify no camera/location hooks or paid calls mount in catalog. Run tests GREEN; `npm run check`; commit `feat(destinations): add catalog navigation and destination pages`.

### Task 3 — Approved daytime gallery and localization

**Files:** `src/features/destinations/daytime-gallery.tsx`, `destination-screen.tsx`, gallery tests, locale resources.

**Interfaces:** Gallery consumes **only approved** image metadata and bundled image sources; local presentation, no Google Photos fetching and no camera. Media objects require descriptive alt and credit; no images → clear placeholder. Fullscreen viewer may be an overlay/modal with close/Back. Content respects `language: 'en'|'ko'|'ja'` and labeled fallback.

- [ ] Write failing tests: no photo fallback, valid approved image credit/caption, thumbnail press/fullscreen/close, failed image resolution, unchanged gallery across day/night, KO/JA partial content explicitly labeled as English fallback. Run RED.
- [ ] Implement Stitch daytime hero/gallery/overview/highlights layout with a compact actual photo count and scrolling. **Do not** use Stitch generated photos or copy their invented factual claims. Do not display gallery count > approved entries.
- [ ] Ensure long names, Japanese/Korean glyphs, 150% font scale and small Android screens scroll without clipped controls. Run component tests GREEN; `npm run check`; commit `feat(destinations): add approved daytime previews and locale fallback`.

### Task 4 — Destination-centered Google nearby establishments

**Files:** `nearby.ts`, `nearby.test.ts`, `nearby-establishments.tsx`, tests; optionally an isolated user-distance component using existing foreground location service.

**Interfaces:** `DESTINATION_NEARBY_RADIUS_METERS = 500`; `withinDestinationRadius(center:Coordinate, item:Coordinate): boolean` uses existing `distanceMeters`. `searchDestinationNearby(center,language)` invokes existing `placesService.nearby({center,radiusMeters:500,language})` only after an explicit button. Uses memory-only TanStack Query with disabled observer and existing error mapping.

- [ ] Write failing tests: 499m included, 500m included, 501m excluded **before rounding**, no center prevents calls, remote-user position doesn't change eligibility, absent user position doesn't prevent catalog/nearby browse; explicit action only. Run RED.
- [ ] Implement explicit See Nearby Places search button. Display returned real names, proper provider attribution, <=20 result disclaimer, distances **from destination**, and optionally separate **from you** when a user explicitly requests foreground GPS. No GPS permission prompt just from opening destination or list.
- [ ] Selecting an establishment uses `placeSelectionOptions` and opens `/place/[providerId]` without losing provider ID or issuing extra hidden details requests. Show empty/error/retry and rate limit statuses correctly.
- [ ] Test blocked paid calls under remount, locale change, focus, background/resume, query invalidation and network failure. Run `npm run check`; commit `feat(destinations): browse establishments around selected site`.

### Task 5 — Verified destination routes and map handoff

**Files:** `catalog.ts` or narrow adapter `routing.ts`, `destination-screen.tsx`, tests; only minimal changes to `route-preview-screen.tsx` / Map if necessary.

**Interfaces:** `destinationToRoutePlace(destination: Destination): Place | null` requires `verified routeEntrance` and uses `provider:'curated'`, `source:'curated'`, `providerId:'curated_'+destination.id`, `id:'destination:'+destination.id`; no Google Places details call. `createRoutePreviewIntent(queryClient, place)` is invoked **once** on explicit Directions press. Route Preview navigates back to the original destination on Place Details for curated subjects.

- [ ] Write failing tests: unavailable/invalid route entrance hides/disables Directions with reason; approved entrance produces correct coordinate and exactly one created intent; double taps are deduped; refocus is free; translated no-route message survives.
- [ ] Wire Get Directions to the existing `/directions?token=...` single-use mechanism. For curated subjects, route preview 'Place Details' must resolve `D01–D09` back to `/destinations/[destinationId]`; Google POI remains `/place/[providerId]`. Do not over-generalize IDs to Google `place-details`.
- [ ] Implement View on Map via safe local curated summary/memory handoff **only if** the existing Map can accept it without calling Google details or routing to unverified coordinates. If more map integration is needed, document as a narrowly scoped follow-up rather than implementing an inert action.
- [ ] Validate normal Map Search/AR/POI Details/Route flows unchanged; `npm run check`; commit `feat(destinations): navigate to verified visitor entrances`.

### Task 6 — Review and delivery

**Files:** Regression tests affected by catalog routes, docs, PR body.

- [ ] Run `npm run check`, `npm run check:android`, `npm run export:android`, `npx expo install --check` and `npx expo-doctor` if Expo/native config changed. Run Edge tests only if Edge code was changed (ideally none). Distinguish Metro export from actual APK/device validation.
- [ ] Device smoke test: catalog opens with GPS denied, nine cards, gallery fallback/verified photo, remote browsing, nearby search only after tap, real credited results, explicit route from approved entrance and back, no duplicate Google calls, CJK/150% font and Android Back. Document blocked cases if no verified content yet.
- [ ] Compare against the **approved** Stitch Lake Danao visual hierarchy; document content-driven differences. Record content approval/blockers; do not claim all nine site previews ready merely because all nine names render.
- [ ] Update `AGENTS.md` only for lasting new architecture rules, update validation notes and create one PR against `main`. Do not merge. Commit `docs(destinations): record field readiness and verification gaps` when appropriate.

## Delivery / agent workflow

- Branch: `feat/featured-destinations`. Existing `ARgala` root and GitHub remote only; no new nested project. Inspect main and protect local changes. If worktrees are customary in the environment, follow the established setup rules.
- One PR for this cohesive vertical journey, or split into two PRs **only when** data approvals prevent meaningful review of the combined implementation. Small validated tasks and Conventional Commits; no feature dump commit.
- The source content CSV is an **input checklist**, not a verified data file, and must not be copied into runtime as approved content.
- End report: implemented UX, provider calls and permissions, missing verified centers/entrances/assets/translations, tests and actual Android checks, design deviations, PR URL. Do not infer production readiness from CI alone.
