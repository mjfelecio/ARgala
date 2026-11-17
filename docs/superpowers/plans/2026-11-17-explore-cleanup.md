# Explore cleanup implementation plan

> **For agentic workers:** Use focused independent implementation tasks, regression-first verification, and a final combined review. Owner approved the conversation plan and image concepts on 2026-11-17.

**Goal:** Polish startup, Explore selection, saved places and featured photography within Seafoam Forest.

**Architecture:** Ordinary and featured selections converge in Explore. Partial seeds remain distinct from complete transient provider responses. Principal-scoped local bookmark metadata persists atomically with the existing ID journal; only the ID journal syncs. Existing native scene, map, GPS and paid-intent contracts remain.

**Tech stack:** Installed Expo 57, strict TypeScript, UniWind/HeroUI, React Native Maps, TanStack Query, AsyncStorage, react-native-svg. No new dependencies, APK build or publishing.

## Owner decisions and constraints

- Map-first startup after a branded JS bootstrap; retain the native splash and onboarding rules.
- Saved Google names are user-written labels, optional user-written note/address. No permanent copies of Google names/addresses. Coordinates expire 30 days after original capture, without passive refresh.
- Featured matching uses verified exact Google place IDs only; associations are display-only and do not authorize AR. Unverifiable IDs remain unmatched.
- Primary Open in Google Maps is always visible; Directions/Save are secondary. Ordinary detail screens redirect to the map sheet. Featured pages remain.
- Featured galleries show every bundled photo, captions in accessibility labels/fullscreen viewer, credits remain available. Bottom safe-area Close and previous/next controls.
- Listing images and destination-title actions use sibling hit areas. Photo backdrop fades to forest at the title; closed passport book/globe keeps the current color.
- Remove public approval-workflow jargon while retaining unavailable states and development provenance. Keep AR scenes, admission rules and pilot-aclc separate.

## Review focus

- Partial POI seeds must never acquire complete-response/cache authority.
- No paid requests from mount, focus, resume, locale changes, URL redirects or persistent markers.
- Guest/account transfer and failed storage writes cannot lose labels or change coordinate expiry.
- Compact sheet actions remain visible at large text/short heights without moving map content.
- All 53 photo entrances, original order/proportions, captions/credits and Android Back remain reachable.

## Task 1: Bookmark metadata storage and actions

Own journal model/repository/provider/context/actions and their tests. Add versioned local envelope containing the existing journal/sync document and local display metadata; preserve cloud wire shape. Save and metadata write atomically; account labels win, guest fills missing, newest valid original pin wins. Unsave clears metadata. Add user-label save form and metadata-aware Saved Places. Old/synced ID-only bookmarks remain explicitly recoverable.

- [x] Add failing migration, persistence failure, expiry, merge, isolation and real-action tests.
- [x] Implement and run journal regressions, typecheck and lint scoped files.
- [x] Expose metadata, metadata-aware save, and a typed saved-open callback/intent integration to Task 3; no ordinary detail route.

## Task 2: Featured gallery/pages and listing

Own daytime-gallery, shared fullscreen viewer, visitor-guide, destination-screen, destinations-screen and passport icon component/tests. Implement image-only large carousels, any-photo fullscreen with bottom caption/credit/Close, list prefixes, photo-led listing sibling hit areas, shared Maps primary link. Preserve data values and eligibility. Add all-locale copy under a separate cleanup namespace to avoid overlapping locale edits.

- [x] Demonstrate gallery/caption/control regressions before implementation.
- [x] Implement and run destination/page/gallery regressions and typecheck.

## Task 3: Map selection, startup, shared controls and integration

Own map files, place selection/intent/URL builder, compatibility ordinary details redirect, navigation callers, startup, arrival component, shared loading and localization. Introduce partial SelectionSeed + single-use explicit selection intent fenced by principal; explicit tap/open alone authorizes one details request. Map first without GPS, browse-only bundled bounds; no implicit camera movement after pan/selection. Primary Maps links work from IDs/curated coordinates without details. Use measured compact action content for sheet/map baseline. Add exact display-only association registry with evidence; do not guess IDs. Persistent featured/saved markers deduplicate, render <=100 saved pins in viewport plus selected and show zoom hint. New matched saves use featured identity, old aliases display/remove consistently.

- [x] Add failing real-map/handoff/cost/loading/redirect tests using production query defaults.
- [x] Implement selection/bootstrap/actions/status/chips and integrate Tasks 1/2 interfaces.
- [x] Verify no ordinary details callers remain; update all EN/JA/KO workflow copy and tests.

## Task 4: Combined verification and delivery

- [x] Run complete npm run check and Android export; inspect native patch verification.
- [x] Review the reconnected A53 using the existing dev client: bootstrap, map-first loading, compact actions, native POI details, Save form, listing/Passport, featured sheet/gallery and photo viewer. Preserve data/settings; no new APK or implicit paid searches. Record the remaining device matrix in docs/validation.md.
- [x] Run fresh independent combined review; address material findings with regressions.
- [x] Update docs/validation.md and AGENTS.md for lasting changed persistence/selection rules. Commit coherent changes with Conventional Commits; no merge/push/build/publication.

## Preflight interface decisions

| Tasks | Shared contract | Resolution |
| --- | --- | --- |
| 1 / 3 | save and saved-open | Journal exposes local metadata; map creates safe partial seeds. Shared selection intent is owned by Task 3. |
| 2 / 3 | Maps URL and gallery | Task 3 owns the pure Maps link helper; gallery exposes media-only reusable props. |
| 1 / 2 / 3 | locale resources | Tasks 1/2 add isolated JSON namespaces under cleanup translations; integration merges them centrally. |
| Each task | constraints vs implementation | No native dependency, provider field-mask or AR authority changes required. |
