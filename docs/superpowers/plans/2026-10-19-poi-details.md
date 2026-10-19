# ARgala — POI Details Implementation Plan

> **For agentic workers:** Implement task-by-task with focused red/green tests and independent review where available. Mark the checkboxes in a copy committed at `docs/superpowers/plans/2026-10-19-poi-details.md` after confirming current repository state.

**Goal:** Add one navigable Place Details screen, entered from both Home Map and AR, matching the approved rich/minimal Stitch designs using real available data and preserving ARgala's existing location, provider, and route behavior.

**Architecture:** A protected, non-tab Expo Router stack screen reads an existing in-memory `Place` selection by immutable Google provider ID. It renders optional content through a single HeroUI Native + UniWind presentation. The screen performs no paid provider request on mount; existing service calls remain explicit. The existing Map screen continues to own walking-route rendering during this PR.

**Tech Stack:** Expo SDK 57, Expo Router, UniWind/Tailwind CSS v4, HeroUI Native 1.0.10, Plus Jakarta Sans, TanStack Query, i18next, Google Places via Supabase Edge Functions, Vitest, React Native Android.

**Source of truth:** Current `AGENTS.md`, `global.css`, `docs/design/clean-explorer/SCREEN_SPECIFICATIONS.md` P01/P02, `SCOPE_AND_DECISIONS.md`, and the approved Stitch `argala_place_details_rich` / `argala_place_details_minimal` exports. Direct client requirements take precedence over conflicting draft SRS restrictions. Reference files in accompanying ZIP are illustrations, not application data.

**Checked baseline:** `main` SHA `da2ef4ee8cb88c86713301dcb2ee4c9de77a50a0` on 2026-10-19 21:14 Asia/Manila; PR #9 merged. Recheck upstream and worktree status before development; do not force a stale ref.

## Global constraints

- Android only; **do not** recreate the Expo app, move files outside existing `ARgala`, or replace the verified `Tabs` + parent `Stack` structure.
- Single `PlaceDetails` screen supports rich and minimal data. **Do not** make two parallel implementations.
- `global.css` is authoritative for palette, type, spacing and component styles; use UniWind `className` and HeroUI Native components. Dynamic native measurements may still use native style props.
- Preserve native Google Maps/Places/Routes contracts, existing query lifecycle, authentication/permissions, live camera/sensors, AR selection and provider IDs.
- `Place` currently has `provider`, `providerId`, `name`, `coordinates`, optional `address`, `description`, `mapsUri`, `source`, and `attributions`. **No photos, categories, ratings, business hours, weather, etc.** Do not fabricate them or add billable API fields for this design PR.
- No provider request on opening, mounting, refocusing, resuming, switching locale, or simply expanding details. Extra Place Details is only fetched by an explicit user action when genuinely missing and not already loaded.
- Use in-memory handoff with `placeSelectionOptions(providerId)`; do not persist Google Places content, location history, or camera frames. Retain Google and third-party attributions on an off-map details screen.
- No new package unless its absence genuinely blocks a required interaction; first reuse installed HeroUI, Ionicons and existing app providers.
- Keep EN/KO/JA strings in locale JSON; error codes translated at UI boundary, with no leaked provider/native diagnostics.
- Preserve current **explicit** Map `Walk` action. Do **not** quietly build one-tap navigation logic into a mount effect. The later Walking Directions PR will own a one-tap route-preview handoff if needed.

## Review focus — scenarios that must have tests

1. **Cold-open / evicted selection:** direct URL with valid ID but no cached Place renders a useful unavailable/loading-on-demand state, never crashes and never requests Google until user explicitly taps Load Details.
2. **Data sparsity:** name-only or name/address/coordinates content looks intentional; no empty hero, fabricated business attributes or blank sections.
3. **Back and origin:** opening Details from Explore and AR returns to the correct context; the selected provider ID is preserved; no duplicate map tab, duplicate header or unintended camera watcher restart.
4. **Provider costs:** show/leave/return, locale change and remount don't fetch Places/Routes; selecting an already loaded full detail does not offer another unnecessary paid reload.
5. **Location + credits:** no current usable fix means no asserted user distance; user-relative straight-line meters never masquerade as walk duration; provider branding and attributions remain visible and legible.

---

## Task 1 — Protected route and selection handoff

**Files (inspect first; change only as necessary):**
- Create: `src/app/(app)/place/[providerId].tsx` (thin route adapter)
- Create: `src/features/places/place-details-screen.tsx`
- Create: `src/features/places/place-details-screen.test.tsx`
- Update: `src/app/(app)/_layout.tsx` (stack route declaration / header suppression)
- Reuse: `src/features/places/selection.ts`, `src/features/places/service.ts`, `supabase/functions/_shared/contracts.ts`

**Interfaces:** Route param `providerId: string` validated with the existing `detailsRequestSchema`; selected summary from `placeSelectionOptions(providerId)`; loaded full detail from existing language-keyed `['place-details', providerId, language]` query. No new persistent store.

- [x] Write tests first: a valid provider ID and cached Place render title; invalid/missing ID is safe; empty cache shows an honest recovery state; opening Details makes **zero** `placesService.details` calls.
- [x] Run focused tests and observe them fail for the missing functionality.
- [x] Add the thin protected stack route above `(tabs)`, with **one** screen header/back action (not the two headers in Stitch).
- [x] Read current cached selection using existing TanStack Query conventions; do not automatically fetch a missing summary. Implement a simple explicit Load Details fallback using `placesService.details(id, language)` with existing error mapping.
- [x] Run the focused tests until green; typecheck/lint; make one Conventional Commit, e.g. `feat(places): add protected details route and cached handoff`.

## Task 2 — Rich/minimal POI presentation

**Files:**
- Modify: `src/features/places/place-details-screen.tsx`
- Create or extend: `src/features/places/place-details-content.tsx` (only if it keeps responsibilities smaller)
- Test: `src/features/places/place-details-screen.test.tsx`
- Change `global.css` **only** for genuinely shared, missing semantic tokens or HeroUI component overrides; never duplicate the existing palette in TypeScript.

**Interfaces:** Accept one `Place | null`, optional user-relative distance only from a valid/fresh device fix, detail-loading/error state, and callbacks for Load Details, Get Directions, View on Map, Open AR, and Back. The current `Place` DTO has no photo.

- [x] Write tests: minimal name-only and address-only fixtures; optional description; long translated text; no photo; loading and error with summary retained; missing distance; attributed place; no unsupported static badges.
- [x] Run red tests.
- [x] Build a **full-height scrollable page** using HeroUI Buttons/Card/Surface where semantically appropriate, UniWind classes, existing Ionicons and Plus Jakarta Sans. Use a compact neutral/mint media fallback, **not** a fake photo or giant empty hero.
- [x] Preserve the approved button hierarchy: full-width primary **Get Directions**; lighter **View on Map** and **Open AR** actions with consistent heights and icons. Only show buttons with real targets.
- [x] Show real name, optional address/description, user-relative straight-line distance if reliably available, provider/third-party credits; hide unsupported metadata rather than filling design placeholders. No fake Google rating, opening hours, photo, UNESCO tag, weather, tourist copy, or Google Place type label.
- [x] Preserve future rich presentation as an **optional approved-image slot** in the view model; no new Places photos API, schema, or media fetch in this PR. Tests may inject a labeled synthetic rich fixture; runtime defaults remain minimal.
- [x] Run focused tests, `npm run check`, and commit e.g. `feat(ui): render rich and sparse POI details with HeroUI`.

## Task 3 — Enter Details from both Map and AR

**Files:**
- Modify: `src/features/map/map-screen.tsx`, `src/features/map/place-sheet.tsx` if adding a supported Details action to the existing selected-POI sheet.
- Modify: `src/features/ar/ar-discovery.tsx` (add **View Details** navigation action, preserve existing paid Load additional details behavior only when needed)
- Tests: existing Map/AR component suites and targeted new tests.

**Interfaces:** Both entry points write the already selected `Place` into `queryClient.setQueryData(placeSelectionOptions(providerId).queryKey, place)` and navigate to the same protected Details route. Back returns to the originating Map or AR context; avoid introducing a new tab or parallel details screen.

- [x] Write tests: Map and AR each navigate to the **same** provider-ID route; handoff summary equals current selection; opening Details adds **no** paid requests; returning to AR retains appropriate focus/permission safety.
- [x] Run red tests, then wire explicit **View Details** actions for selected POIs. Do not force full-page navigation merely by tapping a map marker or AR floating label; preserve quick selection/summary interactions.
- [x] Preserve `MapScreen` route origin/POI state, AR sensor lifecycle, map attribution, the explicit Search/Scan/Walk request rules, and no-payment-on-refocus contract.
- [x] Verify tests and commit e.g. `feat(navigation): open POI details from map and AR`.

## Task 4 — Action navigation and provider-budget semantics

**Files:**
- Modify: `src/features/places/place-details-screen.tsx` and existing Map selection handler as required.
- Test: `src/features/places/place-details-screen.test.tsx`, Map/AR route and request-count tests.

**Interfaces:** `View on Map` opens Explore with `placeId` and a seeded in-memory handoff (no provider request). `Open AR` navigates to the real immersive AR screen, without promising remote anchoring or fake on-site recognition. **Get Directions** navigates to selected Map route UI where the **existing explicit Get walking route** action is available. This interim two-tap sequence must be documented; the next Walking Directions milestone can replace it with tested one-tap intent. Avoid adding an implicit Directions API request on navigation.

- [x] Write tests for each action and destination; ensure the correct selection and no route/details request on opening or Back/refocus. Ensure loading/error guards prevent double submits.
- [x] Run red tests; implement the smallest handoff to existing route screens. Validate route/selection can recover after cold open or cache eviction.
- [x] Validate and commit e.g. `feat(places): connect details actions to existing map and AR flows`.

## Task 5 — Regression, documentation and Android acceptance

**Files:**
- Modify: `src/i18n/locales/{en,ko,ja}.json` for all new text/empty/error/loading/accessibility states.
- Modify: `docs/validation.md`, optionally a short `docs/design/clean-explorer/PLACE_DETAILS.md` explaining P01/P02 and intentional deviations.
- Preserve: `global.css`, Expo configuration, backend functions unless tests demonstrate a needed correction.

- [ ] Test both visual variants in English, Korean and Japanese, large text and long names; verify Voice/Focus and keyboard/tap targets where applicable.
- [ ] Run `npm run check`, `npm run check:android`, and `npm run export:android`. Run other project checks if touched modules require them. Record commands, counts, and **whether** they actually passed; never infer pass from earlier CI.
- [ ] Real Android smoke check: Map → Details → Back; AR → Details → Back; details optional data; no content; tap Get Directions to Map + Walk; return without scan/route duplication; visibility of provider attribution. Note if physical testing is unavailable.
- [ ] Review screenshot against approved P01/P02 from the ZIP; document truthful differences (no photo, provider category, rating, hours). No fake content for visual parity.
- [ ] Incremental commit for tests/docs. Push branch `feat/poi-details-screen`; open PR to latest `main` and **do not merge**. Ask for independent review; address only verified issues and keep cohesive commit history.

## Acceptance criteria

- One navigable Place Details route, not a fourth tab or two separate rich/minimal screens.
- Entry from selected Map POI and selected AR POI; Back returns appropriately.
- Screen uses UniWind + HeroUI Native and centralized `global.css` theme; practical Android portrait layout.
- The minimal-real-data variant is polished even with no images/categories/ratings/hours.
- If rich approved content is later provided, it has an optional presentation slot without the PR inventing provider fields now.
- Details never silently trigger Google Places/Routes charges on entry; explicit Load Details when truly missing.
- All three detail actions navigate meaningfully; Get Directions currently returns to the Map where explicit Get walking route remains available, with this interim behavior disclosed.
- Existing live location/AR/map/routing, permissions, sensor lifecycles, attribution, localization, and CI continue to work.

## Scope of next PR (not this PR)

After this feature: Walking Directions UI (Stitch R01) with an explicit **one-tap Get Directions → route preview** handoff, tested for at most one paid route call. Avoid claiming that UX is already finished in this POI Details PR.

## Execution handoff

The owner has approved the high-level sequence and already uses an agent. Have that agent read this plan plus the selected references, inspect current `main`, and implement **this PR only**. Review the plan against the code before executing; if a route or provider contract has changed since the checked baseline, update the plan first rather than forcing it.

## Execution record

- Baseline rechecked: origin/main `da2ef4e`; clean tracked checkout; supplied ZIP extracted outside Git. Baseline `npm run check`: 221 tests passed.
- Task 1: missing-screen red observed; cached/cold-open/invalid-ID/error recovery plus shell tests green (17 tests). Disabled observers use existing keys and transient retention.
- Decision: keep details location-independent and omit user distance when no reliable live fix is owned by this screen. This avoids starting another permission/sensor lifecycle merely to read a place; Map and AR retain ownership.

- Task 2: sparse/description/credits and approved-image-slot RED→GREEN; pending request guard verified through native button disabled prop. `npm run check`: 237 tests / 31 files, typecheck and zero-warning lint passed. Device typography and pixel fidelity remain acceptance work.

- Task 3: both absent entry actions failed first; Map/AR/sheet suites pass 73 tests. Typecheck passed after SDK-generated route types were refreshed using offline Metro. Exclude generated `.expo` artifacts from lint: SDK 57 emits a redundant eslint-disable in router.d.ts. No generated declarations are committed.

- Task 4: navigation/AR incoming selection/map centering tests failed before implementation. Actions hand off with SDK `dismissTo` to avoid duplicate parent tabs; installed Stack/Tab reducers and divergent-state payload mapping verify Back and return identity. Explicit paid request rules remain. `npm run check`: 252 tests / 31 files passed with typecheck and zero-warning lint. `npm run check:android` passed.
